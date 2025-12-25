export interface GitHubUrlInfo {
  owner: string;
  repo: string;
  pageType: 'home' | 'tree' | 'blob' | 'issues' | 'pulls' | 'other';
  path?: string;
  branch?: string;
}

export interface RepoInfo {
  owner: string;
  repo: string;
  description: string;
  stars: number;
  language: string;
  defaultBranch: string;
}

export interface FileTreeNode {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  sha?: string;
  url?: string;
}

export interface RepoContext {
  info: RepoInfo;
  readme: string;
  fileTree: FileTreeNode[];
  files: Record<string, string>; // path -> content
  fetchedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  repoKey: string; // owner/repo
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export type AIProvider = 'ollama' | 'gemini';

export interface Settings {
  aiProvider: AIProvider;
  ollamaUrl: string;
  geminiApiKey: string;
  selectedModel: string;
  githubToken?: string;
}
