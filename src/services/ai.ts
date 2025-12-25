/**
 * 统一 AI 服务接口 - 支持多 AI 源切换
 */
import { ollamaService } from './ollama';
import { geminiService } from './gemini';

export type AIProvider = 'ollama' | 'gemini';

export interface AIServiceInterface {
  getModels(): Promise<string[]>;
  checkConnection(): Promise<boolean>;
  chat(
    model: string,
    messages: { role: string; content: string }[],
    signal?: AbortSignal
  ): AsyncGenerator<string>;
}

class AIService {
  private currentProvider: AIProvider = 'ollama';

  setProvider(provider: AIProvider) {
    this.currentProvider = provider;
  }

  getProvider(): AIProvider {
    return this.currentProvider;
  }

  getService(): AIServiceInterface {
    switch (this.currentProvider) {
      case 'gemini':
        return geminiService;
      case 'ollama':
      default:
        return ollamaService;
    }
  }

  async getModels(): Promise<string[]> {
    return this.getService().getModels();
  }

  async checkConnection(): Promise<boolean> {
    return this.getService().checkConnection();
  }

  async *chat(
    model: string,
    messages: { role: string; content: string }[],
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    yield* this.getService().chat(model, messages, signal);
  }
}

export const aiService = new AIService();
