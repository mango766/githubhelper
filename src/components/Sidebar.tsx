import React, { useState, useEffect } from 'react';
import { GitHubIcon, CloseIcon } from './Icons';
import { TabBar } from './TabBar';
import { TrendingPage } from './TrendingPage';
import { AIChatPage } from './AIChat/AIChatPage';
import { parseGitHubUrl } from '../utils/url';
import { GitHubUrlInfo } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'trending'>('trending');
  const [urlInfo, setUrlInfo] = useState<GitHubUrlInfo | null>(null);

  // Parse current URL and detect if it's a repo page
  useEffect(() => {
    const updateUrlInfo = () => {
      const info = parseGitHubUrl(window.location.href);
      setUrlInfo(info);
      
      // Auto-switch to AI tab when entering a repo page
      if (info && info.owner && info.repo) {
        setActiveTab('ai');
      }
    };

    updateUrlInfo();

    // Listen for URL changes (SPA navigation)
    const observer = new MutationObserver(() => {
      updateUrlInfo();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Also listen for popstate (back/forward navigation)
    window.addEventListener('popstate', updateUrlInfo);

    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', updateUrlInfo);
    };
  }, []);

  const isRepoPage = Boolean(urlInfo && urlInfo.owner && urlInfo.repo);

  const handleTabChange = (tab: 'ai' | 'trending') => {
    if (tab === 'ai' && !isRepoPage) {
      return; // Don't switch to AI tab if not on a repo page
    }
    setActiveTab(tab);
  };

  // 阻止键盘事件冒泡到宿主页面，防止触发 GitHub 快捷键
  const stopKeyboardPropagation = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className={`gh-sidebar ${isOpen ? 'open' : ''}`}
      onKeyDown={stopKeyboardPropagation}
      onKeyUp={stopKeyboardPropagation}
      onKeyPress={stopKeyboardPropagation}
    >
      {/* Header */}
      <div className="gh-sidebar-header">
        <div className="gh-sidebar-title">
          <GitHubIcon />
          <span>GitHub Helper</span>
        </div>
        <button className="gh-close-btn" onClick={onClose} title="Close (Esc)">
          <CloseIcon />
        </button>
      </div>

      {/* Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isRepoPage={isRepoPage}
      />

      {/* Content */}
      <div className="gh-sidebar-content">
        {activeTab === 'ai' ? (
          <AIChatPage urlInfo={urlInfo} />
        ) : (
          <TrendingPage />
        )}
      </div>
    </div>
  );
};
