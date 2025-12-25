export class OllamaService {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  /**
   * 通过 Background Script 代理 fetch 请求（解决 CORS 问题）
   */
  private async proxyFetch(url: string, options?: RequestInit): Promise<{ ok: boolean; status?: number; data?: string; error?: string }> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: 'PROXY_FETCH',
          url,
          options: {
            method: options?.method || 'GET',
            headers: options?.headers,
            body: options?.body,
          },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * Fetches available models from Ollama (通过代理).
   */
  async getModels(): Promise<string[]> {
    try {
      const res = await this.proxyFetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) {
        throw new Error(`Failed to fetch models: ${res.status || res.error}`);
      }
      const data = JSON.parse(res.data || '{}');
      return (data.models || []).map((m: any) => m.name);
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      return [];
    }
  }

  /**
   * Checks if the Ollama server is reachable (通过代理).
   */
  async checkConnection(): Promise<boolean> {
    try {
      const res = await this.proxyFetch(`${this.baseUrl}/api/version`);
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * 流式聊天 - 通过 Background Script 的 Long-lived Connection 代理
   */
  async *chat(
    model: string,
    messages: { role: string; content: string }[],
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    const port = chrome.runtime.connect({ name: 'ollama-stream' });

    // 创建一个消息队列来处理流式数据
    const messageQueue: Array<{ type: string; content?: string; error?: string }> = [];
    let resolveNext: (() => void) | null = null;
    let isDone = false;

    port.onMessage.addListener((msg: { type: string; content?: string; error?: string }) => {
      messageQueue.push(msg);
      if (resolveNext) {
        resolveNext();
        resolveNext = null;
      }
    });

    port.onDisconnect.addListener(() => {
      isDone = true;
      if (resolveNext) {
        resolveNext();
        resolveNext = null;
      }
    });

    // 监听 abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        port.disconnect();
      });
    }

    // 发送请求
    port.postMessage({ model, messages, baseUrl: this.baseUrl });

    // 迭代消息队列
    try {
      while (!isDone) {
        if (messageQueue.length === 0) {
          await new Promise<void>((resolve) => {
            resolveNext = resolve;
          });
        }

        while (messageQueue.length > 0) {
          const msg = messageQueue.shift()!;

          if (msg.type === 'chunk' && msg.content) {
            yield msg.content;
          } else if (msg.type === 'done') {
            isDone = true;
            break;
          } else if (msg.type === 'error') {
            throw new Error(msg.error || 'Unknown error');
          } else if (msg.type === 'aborted') {
            isDone = true;
            break;
          }
        }
      }
    } finally {
      port.disconnect();
    }
  }
}

export const ollamaService = new OllamaService();
