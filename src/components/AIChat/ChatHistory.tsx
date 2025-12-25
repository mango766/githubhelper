import React, { useState, useEffect } from 'react';
import { ChatSession } from '../../types';
import { storageService } from '../../services/storage';

interface ChatHistoryProps {
  repoKey: string;
  currentSessionId: string | null;
  onSelect: (session: ChatSession) => void;
  onClose: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  repoKey,
  currentSessionId,
  onSelect,
  onClose,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      const allSessions = await storageService.getChatSessions(repoKey);
      // Sort by most recent first
      const sorted = allSessions.sort((a, b) => b.updatedAt - a.updatedAt);
      setSessions(sorted);
      setLoading(false);
    };

    loadSessions();
  }, [repoKey]);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    await storageService.deleteChatSession(sessionId);
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  return (
    <div className="gh-chat-history">
      <div className="gh-chat-history-header">
        <span>历史对话</span>
        <button className="gh-chat-history-close" onClick={onClose}>
          ✕
        </button>
      </div>
      
      <div className="gh-chat-history-list">
        {loading ? (
          <div className="gh-chat-history-loading">加载中...</div>
        ) : sessions.length === 0 ? (
          <div className="gh-chat-history-empty">暂无历史对话</div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`gh-chat-history-item ${session.id === currentSessionId ? 'active' : ''}`}
              onClick={() => onSelect(session)}
            >
              <div className="gh-chat-history-item-title">
                {session.title || '新对话'}
              </div>
              <div className="gh-chat-history-item-meta">
                <span>{session.messages.length} 条消息</span>
                <span>{formatDate(session.updatedAt)}</span>
              </div>
              <button
                className="gh-chat-history-item-delete"
                onClick={(e) => handleDelete(e, session.id)}
                title="删除对话"
              >
                🗑
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
