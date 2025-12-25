import { RepoInfo, FileTreeNode } from '../types';

export class GitHubService {
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  setToken(token?: string) {
    this.token = token;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async fetch(url: string) {
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      if (res.status === 403 || res.status === 429) {
        throw new Error('GitHub API rate limit exceeded. Please configure a token in settings.');
      }
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async getRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
    const data = await this.fetch(`https://api.github.com/repos/${owner}/${repo}`);
    return {
      owner: data.owner.login,
      repo: data.name,
      description: data.description || '',
      stars: data.stargazers_count,
      language: data.language || '',
      defaultBranch: data.default_branch,
    };
  }

  async getReadme(owner: string, repo: string): Promise<string> {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
        headers: {
          ...this.getHeaders(),
          'Accept': 'application/vnd.github.raw', // Request raw content
        },
      });
      if (!res.ok) {
        if (res.status === 404) return '';
        throw new Error(`Failed to fetch README: ${res.status}`);
      }
      return await res.text();
    } catch (e) {
      console.warn('Error fetching README:', e);
      return '';
    }
  }

  async getFileTree(owner: string, repo: string, branch: string): Promise<FileTreeNode[]> {
    try {
      const data = await this.fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
      );
      
      // Filter out only blob and tree, ignoring submodules/commits for now if needed
      // but 'tree' includes directories and 'blob' includes files.
      return (data.tree || []).map((item: any) => ({
        path: item.path,
        type: item.type === 'tree' ? 'tree' : 'blob',
        size: item.size,
        sha: item.sha,
        url: item.url,
      }));
    } catch (e) {
      console.error('Error fetching file tree:', e);
      return [];
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          ...this.getHeaders(),
          'Accept': 'application/vnd.github.raw',
        },
      });
      if (!res.ok) {
         throw new Error(`Failed to fetch file content: ${res.status}`);
      }
      return await res.text();
    } catch (e) {
      console.error(`Error fetching file content for ${path}:`, e);
      throw e;
    }
  }
}

export const githubService = new GitHubService();
