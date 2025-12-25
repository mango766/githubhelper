/**
 * Gemini API Service - 支持流式输出
 */
export class GeminiService {
  private apiKey: string = '';
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  setApiKey(key: string) {
    this.apiKey = key;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * 获取可用模型列表
   */
  async getModels(): Promise<string[]> {
    // Gemini 常用模型列表（免费可用）
    return [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ];
  }

  /**
   * 检查 API Key 是否有效
   */
  async checkConnection(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const res = await fetch(
        `${this.baseUrl}/models?key=${this.apiKey}`,
        { method: 'GET' }
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * 流式对话
   */
  async *chat(
    model: string,
    messages: { role: string; content: string }[],
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    if (!this.apiKey) {
      throw new Error('请先配置 Gemini API Key');
    }

    // 转换消息格式：Gemini 使用 user/model 而非 user/assistant
    // 并且需要将 system prompt 合并到第一条 user 消息
    const contents = this.convertMessages(messages);

    const res = await fetch(
      `${this.baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
        signal,
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      let errorMsg = `Gemini API error: ${res.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error?.message || errorMsg;
      } catch {
        errorMsg = errorText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    if (!res.body) {
      throw new Error('Response body is null');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          const jsonStr = trimmedLine.slice(6);
          if (jsonStr === '[DONE]') continue;

          try {
            const json = JSON.parse(jsonStr);
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              yield text;
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 转换消息格式为 Gemini 格式
   */
  private convertMessages(
    messages: { role: string; content: string }[]
  ): { role: string; parts: { text: string }[] }[] {
    const contents: { role: string; parts: { text: string }[] }[] = [];
    let systemPrompt = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompt = msg.content;
        continue;
      }

      const role = msg.role === 'assistant' ? 'model' : 'user';
      let content = msg.content;

      // 将 system prompt 合并到第一条 user 消息
      if (role === 'user' && systemPrompt && contents.length === 0) {
        content = `${systemPrompt}\n\n---\n\n${content}`;
        systemPrompt = '';
      }

      contents.push({
        role,
        parts: [{ text: content }],
      });
    }

    return contents;
  }
}

export const geminiService = new GeminiService();
