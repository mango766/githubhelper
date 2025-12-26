import React, { useCallback, useMemo, useState } from 'react';
import { useGitHubSearch, TimeRange } from '../hooks/useGitHubSearch';
import { SearchBar } from './SearchBar';
import { TimeFilter } from './TimeFilter';
import { RepoCard } from './RepoCard';
import { SelectionBar } from './SelectionBar';
import { Toast } from './AIChat/Toast';
import { AlertIcon, InboxIcon } from './Icons';

// 格式化剩余时间
function formatResetTime(resetTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diffSeconds = resetTimestamp - now;
  
  if (diffSeconds <= 0) return '即将';
  
  if (diffSeconds < 60) {
    return `${diffSeconds}秒`;
  } else if (diffSeconds < 3600) {
    const minutes = Math.ceil(diffSeconds / 60);
    return `${minutes}分钟`;
  } else if (diffSeconds < 86400) {
    const hours = Math.ceil(diffSeconds / 3600);
    return `${hours}小时`;
  } else {
    const days = Math.ceil(diffSeconds / 86400);
    return `${days}天`;
  }
}

export const TrendingPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [keyword, setKeyword] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const {
    repositories,
    loading,
    error,
    rateLimitInfo,
    hasMore,
    totalCount,
    search,
    loadMore,
    refresh,
  } = useGitHubSearch();

  const handleSearch = useCallback(
    (newKeyword: string) => {
      setKeyword(newKeyword);
      setSelectedRepos(new Set()); // 搜索时清空选择
      search(newKeyword, timeRange);
    },
    [search, timeRange]
  );

  const handleTimeRangeChange = useCallback(
    (newTimeRange: TimeRange) => {
      setTimeRange(newTimeRange);
      setSelectedRepos(new Set()); // 切换时间范围时清空选择
      search(keyword, newTimeRange);
    },
    [search, keyword]
  );

  const handleSelectRepo = useCallback((id: number, selected: boolean) => {
    setSelectedRepos(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedRepos(new Set());
  }, []);

  const handleCopyCloneCommands = useCallback(async () => {
    const selectedRepoList = repositories.filter(repo => selectedRepos.has(repo.id));
    const commands = selectedRepoList
      .map(repo => `git clone https://github.com/${repo.full_name}.git`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(commands);
      setToast({ message: `已复制 ${selectedRepoList.length} 个仓库的克隆命令`, type: 'success' });
    } catch (err) {
      setToast({ message: '复制失败，请重试', type: 'error' });
      throw err;
    }
  }, [repositories, selectedRepos]);

  const showRateLimitWarning = rateLimitInfo && rateLimitInfo.remaining < 10;
  
  const resetTimeDisplay = useMemo(() => {
    if (!rateLimitInfo) return '';
    const resetTime = new Date(rateLimitInfo.reset * 1000).toLocaleTimeString();
    const duration = formatResetTime(rateLimitInfo.reset);
    return `${resetTime} (${duration})`;
  }, [rateLimitInfo]);

  return (
    <>
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Rate Limit Warning */}
      {showRateLimitWarning && (
        <div className="gh-rate-limit">
          <AlertIcon />
          <span>
            API 调用剩余 {rateLimitInfo.remaining} 次，{resetTimeDisplay} 后重置
          </span>
        </div>
      )}

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} disabled={loading} />

      {/* Time Filter */}
      <TimeFilter value={timeRange} onChange={handleTimeRangeChange} disabled={loading} />

      {/* Repository List */}
      <div className="gh-repo-list" style={{ paddingBottom: selectedRepos.size > 0 ? '70px' : '8px' }}>
        {/* Error State */}
        {error && (
          <div className="gh-error">
            <p>{error}</p>
            <button className="gh-error-retry" onClick={refresh}>
              重试
            </button>
          </div>
        )}

        {/* Loading State (initial) */}
        {loading && repositories.length === 0 && (
          <div className="gh-loading">
            <div className="gh-spinner" />
            <span>加载中...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && repositories.length === 0 && (
          <div className="gh-empty">
            <InboxIcon />
            <p>没有找到相关项目</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              尝试其他关键词或时间范围
            </p>
          </div>
        )}

        {/* Repository Cards */}
        {repositories.map((repo) => (
          <RepoCard
            key={repo.id}
            repo={repo}
            showCheckbox
            selected={selectedRepos.has(repo.id)}
            onSelect={handleSelectRepo}
          />
        ))}

        {/* Load More */}
        {!loading && !error && repositories.length > 0 && hasMore && (
          <div className="gh-load-more">
            <button className="gh-load-more-btn" onClick={loadMore}>
              加载更多 ({repositories.length} / {totalCount > 1000 ? '1000+' : totalCount})
            </button>
          </div>
        )}

        {/* Loading More */}
        {loading && repositories.length > 0 && (
          <div className="gh-loading" style={{ padding: '20px' }}>
            <div className="gh-spinner" />
          </div>
        )}
      </div>

      {/* Selection Bar */}
      <SelectionBar
        selectedCount={selectedRepos.size}
        onCopy={handleCopyCloneCommands}
        onClear={handleClearSelection}
      />
    </>
  );
};
