import { useState, useCallback, useEffect, useRef } from 'react';
import {
  searchRepositories,
  Repository,
  RateLimitInfo,
  SearchParams,
} from '../utils/api';

export type TimeRange = 'week' | 'month' | 'all';

interface UseGitHubSearchResult {
  repositories: Repository[];
  loading: boolean;
  error: string | null;
  rateLimitInfo: RateLimitInfo | null;
  hasMore: boolean;
  totalCount: number;
  search: (keyword: string, timeRange: TimeRange) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useGitHubSearch(): UseGitHubSearchResult {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const currentParamsRef = useRef<SearchParams>({
    keyword: '',
    timeRange: 'week',
    page: 1,
    perPage: 20,
  });

  const search = useCallback(async (keyword: string, timeRange: TimeRange) => {
    setLoading(true);
    setError(null);
    setRepositories([]);
    setHasMore(true);

    currentParamsRef.current = {
      keyword,
      timeRange,
      page: 1,
      perPage: 20,
    };

    try {
      const { data, rateLimitInfo } = await searchRepositories(currentParamsRef.current);
      setRepositories(data.items);
      setTotalCount(data.total_count);
      setRateLimitInfo(rateLimitInfo);
      setHasMore(data.items.length === currentParamsRef.current.perPage && data.total_count > data.items.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    currentParamsRef.current.page += 1;

    try {
      const { data, rateLimitInfo } = await searchRepositories(currentParamsRef.current);
      setRepositories((prev) => [...prev, ...data.items]);
      setRateLimitInfo(rateLimitInfo);
      setHasMore(data.items.length === currentParamsRef.current.perPage && repositories.length + data.items.length < data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      currentParamsRef.current.page -= 1; // Revert page on error
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, repositories.length]);

  const refresh = useCallback(async () => {
    await search(currentParamsRef.current.keyword || '', currentParamsRef.current.timeRange);
  }, [search]);

  // Initial search on mount
  useEffect(() => {
    search('', 'week');
  }, [search]);

  return {
    repositories,
    loading,
    error,
    rateLimitInfo,
    hasMore,
    totalCount,
    search,
    loadMore,
    refresh,
  };
}
