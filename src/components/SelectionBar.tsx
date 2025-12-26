import React, { useState, useCallback } from 'react';

interface SelectionBarProps {
  selectedCount: number;
  onCopy: () => Promise<void>;
  onClear: () => void;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({
  selectedCount,
  onCopy,
  onClear,
}) => {
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (copying || copied) return;
    
    setCopying(true);
    try {
      await onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setCopying(false);
    }
  }, [copying, copied, onCopy]);

  if (selectedCount === 0) return null;

  return (
    <div className="gh-selection-bar">
      <span className="gh-selection-count">已选 {selectedCount} 个</span>
      <div className="gh-selection-actions">
        <button 
          className="gh-selection-btn gh-selection-btn-clear"
          onClick={onClear}
        >
          取消选择
        </button>
        <button 
          className={`gh-selection-btn gh-selection-btn-copy ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          disabled={copying}
        >
          {copied ? '已复制 ✓' : '复制克隆命令'}
        </button>
      </div>
    </div>
  );
};
