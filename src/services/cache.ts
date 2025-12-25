import { RepoContext } from '../types';

const CACHE_KEY_PREFIX = 'gh_repo_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export class CacheService {
  private getCacheKey(owner: string, repo: string): string {
    return `${CACHE_KEY_PREFIX}${owner}/${repo}`;
  }

  /**
   * Retrieves cached repository context.
   */
  async getRepoContext(owner: string, repo: string): Promise<RepoContext | null> {
    const key = this.getCacheKey(owner, repo);
    const result = await chrome.storage.local.get(key);
    const cached = result[key] as RepoContext | undefined;

    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      return cached;
    }
    
    if (cached) {
      // Clean up expired cache
      await this.clearCache(owner, repo);
    }
    
    return null;
  }

  /**
   * Saves repository context to cache.
   */
  async setRepoContext(owner: string, repo: string, context: RepoContext): Promise<void> {
    const key = this.getCacheKey(owner, repo);
    // Ensure we don't exceed storage limits by storing too much file content
    // We might need a strategy to evict old files or limit size here in the future
    await chrome.storage.local.set({ [key]: context });
  }

  /**
   * Updates content of a specific file in the cache.
   */
  async updateFileContent(
    owner: string, 
    repo: string, 
    path: string, 
    content: string
  ): Promise<void> {
    const context = await this.getRepoContext(owner, repo);
    if (context) {
      context.files[path] = content;
      await this.setRepoContext(owner, repo, context);
    }
  }

  /**
   * Clears cache for a specific repo or all repos.
   */
  async clearCache(owner?: string, repo?: string): Promise<void> {
    if (owner && repo) {
      const key = this.getCacheKey(owner, repo);
      await chrome.storage.local.remove(key);
    } else {
      const allKeys = await chrome.storage.local.get(null);
      const keysToRemove = Object.keys(allKeys).filter(k => k.startsWith(CACHE_KEY_PREFIX));
      await chrome.storage.local.remove(keysToRemove);
    }
  }
}

export const cacheService = new CacheService();
