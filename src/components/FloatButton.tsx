import React from 'react';
import { FireIcon } from './Icons';

interface FloatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const FloatButton: React.FC<FloatButtonProps> = ({ onClick, isOpen }) => {
  return (
    <button
      className={`gh-float-btn ${isOpen ? 'hidden' : ''}`}
      onClick={onClick}
      title="GitHub Helper (Ctrl+Shift+G)"
      aria-label="Toggle GitHub Helper sidebar"
    >
      <FireIcon />
    </button>
  );
};
