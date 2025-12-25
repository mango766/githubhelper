import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AIProvider } from '../../types';

interface AIProviderSelectorProps {
  value: AIProvider;
  onChange: (provider: AIProvider) => void;
  geminiConfigured: boolean;
}

const PROVIDERS: { id: AIProvider; icon: string; name: string; desc: string }[] = [
  { id: 'ollama', icon: '🦙', name: 'Ollama', desc: '本地运行，完全免费' },
  { id: 'gemini', icon: '✨', name: 'Gemini', desc: 'Google AI，需要 API Key' },
];

export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  value,
  onChange,
  geminiConfigured,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单 - 使用 composedPath 处理 Shadow DOM
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!containerRef.current) return;
    
    // 使用 composedPath 获取事件路径，支持 Shadow DOM
    const path = event.composedPath();
    const isInside = path.includes(containerRef.current);
    
    if (!isInside) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // 使用 capture 阶段确保能捕获到事件
      document.addEventListener('mousedown', handleClickOutside, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen, handleClickOutside]);

  const currentProvider = PROVIDERS.find(p => p.id === value) || PROVIDERS[0];

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = (e: React.MouseEvent, provider: AIProvider) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (provider === 'gemini' && !geminiConfigured) {
      // 不关闭菜单，让用户看到提示
      return;
    }
    onChange(provider);
    setIsOpen(false);
  };

  return (
    <div className="gh-ai-provider-selector" ref={containerRef}>
      <button
        className="gh-ai-provider-badge-btn"
        onClick={handleToggle}
        onMouseDown={(e) => e.stopPropagation()}
        title={`当前: ${currentProvider.name}，点击切换`}
        type="button"
      >
        {currentProvider.icon}
      </button>

      {isOpen && (
        <div className="gh-ai-provider-menu" onMouseDown={(e) => e.stopPropagation()}>
          {PROVIDERS.map((provider) => {
            const isDisabled = provider.id === 'gemini' && !geminiConfigured;
            const isSelected = provider.id === value;

            return (
              <div
                key={provider.id}
                className={`gh-ai-provider-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={(e) => handleSelect(e, provider.id)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <span className="gh-ai-provider-item-icon">{provider.icon}</span>
                <div className="gh-ai-provider-item-info">
                  <span className="gh-ai-provider-item-name">{provider.name}</span>
                  <span className="gh-ai-provider-item-desc">
                    {isDisabled ? '请先在设置中配置 API Key' : provider.desc}
                  </span>
                </div>
                {isSelected && <span className="gh-ai-provider-item-check">✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
