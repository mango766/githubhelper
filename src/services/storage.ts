import { ChatSession, Settings } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'gh_helper_sessions',
  SETTINGS: 'gh_helper_settings',
};

const DEFAULT_SETTINGS: Settings = {
  aiProvider: 'ollama',
  ollamaUrl: 'http://localhost:11434',
  geminiApiKey: '',
  selectedModel: '',
};

export class StorageService {
  /**
   * Retrieves all chat sessions, optionally filtered by repo.
   */
  async getChatSessions(repoKey?: string): Promise<ChatSession[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SESSIONS);
    const sessions: ChatSession[] = result[STORAGE_KEYS.SESSIONS] || [];
    
    if (repoKey) {
      return sessions.filter(session => session.repoKey === repoKey);
    }
    return sessions;
  }

  /**
   * Saves or updates a chat session.
   */
  async saveChatSession(session: ChatSession): Promise<void> {
    const sessions = await this.getChatSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index !== -1) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    
    await chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: sessions });
  }

  /**
   * Deletes a chat session by ID.
   */
  async deleteChatSession(sessionId: string): Promise<void> {
    const sessions = await this.getChatSessions();
    const newSessions = sessions.filter(s => s.id !== sessionId);
    await chrome.storage.local.set({ [STORAGE_KEYS.SESSIONS]: newSessions });
  }

  /**
   * Retrieves user settings.
   */
  async getSettings(): Promise<Settings> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEYS.SETTINGS] || {}) };
  }

  /**
   * Saves user settings.
   */
  async saveSettings(settings: Partial<Settings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
  }
}

export const storageService = new StorageService();
