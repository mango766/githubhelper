// GitHub Search API utilities

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  created_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface SearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Repository[];
}

export interface SearchParams {
  keyword?: string;
  timeRange: 'week' | 'month' | 'all';
  page: number;
  perPage: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

// Language colors from GitHub
export const languageColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Lua: '#000080',
  Scala: '#c22d40',
  R: '#198CE7',
  Perl: '#0298c3',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Clojure: '#db5855',
  Erlang: '#B83998',
  Julia: '#a270ba',
  'Objective-C': '#438eff',
  Assembly: '#6E4C13',
  PowerShell: '#012456',
};

function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

function buildQuery(params: SearchParams): string {
  const parts: string[] = [];

  // Add keyword if provided
  if (params.keyword && params.keyword.trim()) {
    parts.push(params.keyword.trim());
  }

  // Add time range filter
  switch (params.timeRange) {
    case 'week':
      parts.push(`created:>${getDateString(7)}`);
      break;
    case 'month':
      parts.push(`created:>${getDateString(30)}`);
      break;
    case 'all':
      // No time filter for all-time
      break;
  }

  // If no keyword provided, search for all repos with minimum stars
  if (!params.keyword || !params.keyword.trim()) {
    parts.push('stars:>100');
  }

  return parts.join(' ');
}

// Simple in-memory cache
interface CacheEntry {
  data: SearchResponse;
  timestamp: number;
  rateLimitInfo: RateLimitInfo;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(params: SearchParams): string {
  return `${params.keyword || ''}-${params.timeRange}-${params.page}`;
}

export async function searchRepositories(
  params: SearchParams
): Promise<{ data: SearchResponse; rateLimitInfo: RateLimitInfo }> {
  const cacheKey = getCacheKey(params);
  const cached = cache.get(cacheKey);

  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { data: cached.data, rateLimitInfo: cached.rateLimitInfo };
  }

  const query = buildQuery(params);
  const url = new URL('https://api.github.com/search/repositories');
  url.searchParams.set('q', query);
  url.searchParams.set('sort', 'stars');
  url.searchParams.set('order', 'desc');
  url.searchParams.set('page', params.page.toString());
  url.searchParams.set('per_page', params.perPage.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  });

  // Parse rate limit info from headers
  const rateLimitInfo: RateLimitInfo = {
    limit: parseInt(response.headers.get('X-RateLimit-Limit') || '60', 10),
    remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '60', 10),
    reset: parseInt(response.headers.get('X-RateLimit-Reset') || '0', 10),
  };

  if (!response.ok) {
    if (response.status === 403 && rateLimitInfo.remaining === 0) {
      throw new Error(`API rate limit exceeded. Resets at ${new Date(rateLimitInfo.reset * 1000).toLocaleTimeString()}`);
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data: SearchResponse = await response.json();

  // Cache the result
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    rateLimitInfo,
  });

  return { data, rateLimitInfo };
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}
