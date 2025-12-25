import React, { useState, useEffect, useCallback } from 'react';
import { FloatButton } from './FloatButton';
import { Sidebar } from './Sidebar';

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Listen for keyboard shortcut message from background script
  useEffect(() => {
    const handleMessage = (message: { type: string }) => {
      if (message.type === 'TOGGLE_SIDEBAR') {
        toggle();
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, [toggle]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  return (
    <div className="gh-helper-container">
      <FloatButton onClick={toggle} isOpen={isOpen} />
      <Sidebar isOpen={isOpen} onClose={close} />
    </div>
  );
};

export default App;
