import React from 'react';
import { AIIcon, FireIcon } from './Icons';

interface TabBarProps {
  activeTab: 'ai' | 'trending';
  onTabChange: (tab: 'ai' | 'trending') => void;
  isRepoPage: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, isRepoPage }) => {
  return (
    <div className="gh-tab-bar">
      <button
        className={`gh-tab ${activeTab === 'ai' ? 'active' : ''}`}
        onClick={() => onTabChange('ai')}
        disabled={!isRepoPage}
        title={!isRepoPage ? '请进入仓库页面使用 AI 问答' : ''}
      >
        <AIIcon className="gh-tab-icon" />
        <span>AI 问答</span>
      </button>
      <button
        className={`gh-tab ${activeTab === 'trending' ? 'active' : ''}`}
        onClick={() => onTabChange('trending')}
      >
        <FireIcon className="gh-tab-icon" />
        <span>热榜</span>
      </button>
    </div>
  );
};
