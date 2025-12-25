import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  isLoading,
  disabled = false,
  placeholder = '输入问题...',
}) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (value.trim() && !disabled && !isLoading) {
      onSend(value);
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 阻止事件冒泡到宿主页面，防止触发 GitHub 快捷键
    e.stopPropagation();
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 阻止所有键盘事件冒泡
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="gh-chat-input-container">
      <textarea
        ref={textareaRef}
        className="gh-chat-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onKeyUp={stopPropagation}
        onKeyPress={stopPropagation}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        rows={1}
      />
      {isLoading ? (
        <button
          className="gh-chat-stop-btn"
          onClick={onStop}
          title="停止生成"
        >
          ⏹
        </button>
      ) : (
        <button
          className="gh-chat-send-btn"
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          title="发送 (Enter)"
        >
          ➤
        </button>
      )}
    </div>
  );
};
