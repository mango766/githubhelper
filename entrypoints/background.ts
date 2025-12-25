export default defineBackground(() => {
  // Listen for keyboard shortcut
  browser.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle_sidebar') {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' });
      }
    }
  });

  // 代理 fetch 请求，解决 content script 的 CORS 问题
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'PROXY_FETCH') {
      const { url, options } = message;
      
      console.log('[Background] PROXY_FETCH:', url);
      
      const headers: Record<string, string> = {};
      if (options?.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (key.toLowerCase() === 'content-type') {
            headers[key] = value as string;
          }
        });
      }
      
      const fetchOptions: RequestInit = {
        method: options?.method || 'GET',
        headers,
        mode: 'cors',
        credentials: 'omit',
      };
      
      if (options?.body && options.method !== 'GET') {
        fetchOptions.body = options.body;
      }
      
      fetch(url, fetchOptions)
        .then(async (res) => {
          const text = await res.text();
          console.log('[Background] Response:', res.status, text.substring(0, 100));
          sendResponse({ 
            ok: res.ok, 
            status: res.status, 
            statusText: res.statusText,
            data: text 
          });
        })
        .catch((error) => {
          console.error('[Background] Fetch error:', error);
          sendResponse({ ok: false, error: error.message });
        });
      
      return true;
    }
  });

  // 流式代理：使用 Long-lived Connection 处理 Ollama 流式响应
  browser.runtime.onConnect.addListener((port) => {
    if (port.name === 'ollama-stream') {
      let abortController: AbortController | null = null;

      port.onMessage.addListener(async (msg: { model: string; messages: any[]; baseUrl: string }) => {
        const { model, messages, baseUrl } = msg;
        abortController = new AbortController();

        try {
          const res = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages, stream: true }),
            signal: abortController.signal,
          });

          if (!res.ok) {
            const errorText = await res.text();
            port.postMessage({ type: 'error', error: `Ollama API error: ${res.status} - ${errorText}` });
            return;
          }

          if (!res.body) {
            port.postMessage({ type: 'error', error: 'Response body is null' });
            return;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const json = JSON.parse(line);
                const content = json.message?.content;
                if (content) {
                  port.postMessage({ type: 'chunk', content });
                }
              } catch {
                // 忽略解析错误
              }
            }
          }

          // 处理剩余 buffer
          if (buffer.trim()) {
            try {
              const json = JSON.parse(buffer);
              const content = json.message?.content;
              if (content) {
                port.postMessage({ type: 'chunk', content });
              }
            } catch {
              // 忽略解析错误
            }
          }

          port.postMessage({ type: 'done' });
        } catch (error: any) {
          if (error.name === 'AbortError') {
            port.postMessage({ type: 'aborted' });
          } else {
            port.postMessage({ type: 'error', error: error.message });
          }
        }
      });

      port.onDisconnect.addListener(() => {
        abortController?.abort();
      });
    }
  });
});
