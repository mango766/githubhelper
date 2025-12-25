import React, { useState, useCallback } from 'react';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  disabled?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, disabled }) => {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSearch(value);
    },
    [value, onSearch]
  );

  // 阻止所有键盘事件冒泡到宿主页面
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        onSearch(value);
      }
    },
    [value, onSearch]
  );

  // 阻止事件冒泡
  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="gh-search-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="gh-search-input"
          placeholder="Search repositories... (e.g., react, machine learning)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={stopPropagation}
          onKeyPress={stopPropagation}
          onFocus={stopPropagation}
          onClick={stopPropagation}
          disabled={disabled}
        />
      </form>
    </div>
  );
};
