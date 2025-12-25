import { GitHubUrlInfo } from '../types';

/**
 * Parses the current URL to extract GitHub repository information.
 * @param url The URL string to parse.
 * @returns GitHubUrlInfo object or null if not a valid GitHub repo URL.
 */
export function parseGitHubUrl(url: string): GitHubUrlInfo | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'github.com') {
      return null;
    }

    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length < 2) {
      return null;
    }

    const owner = parts[0];
    const repo = parts[1];
    
    // Default to home if no further parts
    if (parts.length === 2) {
      return {
        owner,
        repo,
        pageType: 'home',
      };
    }

    const type = parts[2];
    const rest = parts.slice(3);

    // Handle different page types
    let pageType: GitHubUrlInfo['pageType'] = 'other';
    let branch: string | undefined;
    let path: string | undefined;

    if (type === 'tree') {
      pageType = rest.length === 0 ? 'home' : 'tree'; // tree without path is home (branch root)
      if (rest.length > 0) {
        branch = rest[0];
        path = rest.slice(1).join('/');
      }
    } else if (type === 'blob') {
      pageType = 'blob';
      if (rest.length > 0) {
        branch = rest[0];
        path = rest.slice(1).join('/');
      }
    } else if (type === 'issues') {
      pageType = 'issues';
    } else if (type === 'pulls') {
      pageType = 'pulls';
    }

    return {
      owner,
      repo,
      pageType,
      path: path || undefined,
      branch: branch || undefined,
    };
  } catch (e) {
    console.error('Error parsing GitHub URL:', e);
    return null;
  }
}
