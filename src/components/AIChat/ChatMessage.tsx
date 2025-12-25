import React from 'react';
import { ChatMessage } from '../../types';

interface ChatMessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

/**
 * Renders a single chat message with basic markdown support.
 */
export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ 
  message, 
  isStreaming = false 
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`gh-chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="gh-chat-message-avatar">
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="gh-chat-message-content">
        <MessageContent content={message.content} />
        {isStreaming && <span className="gh-chat-cursor" />}
      </div>
    </div>
  );
};

interface MessageContentProps {
  content: string;
}

/**
 * Renders message content with basic markdown formatting.
 */
const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  // Simple markdown rendering
  const renderContent = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';

    lines.forEach((line, index) => {
      // Code block handling
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
          codeContent = '';
        } else {
          inCodeBlock = false;
          elements.push(
            <pre key={`code-${index}`} className="gh-chat-code-block">
              <code className={codeLanguage ? `language-${codeLanguage}` : ''}>
                {codeContent}
              </code>
            </pre>
          );
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += (codeContent ? '\n' : '') + line;
        return;
      }

      // Empty line
      if (!line.trim()) {
        elements.push(<br key={`br-${index}`} />);
        return;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(<h4 key={`h4-${index}`}>{line.slice(4)}</h4>);
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(<h3 key={`h3-${index}`}>{line.slice(3)}</h3>);
        return;
      }
      if (line.startsWith('# ')) {
        elements.push(<h2 key={`h2-${index}`}>{line.slice(2)}</h2>);
        return;
      }

      // List items
      if (line.match(/^[-*]\s/)) {
        elements.push(
          <li key={`li-${index}`}>{renderInlineFormatting(line.slice(2))}</li>
        );
        return;
      }

      // Numbered list
      if (line.match(/^\d+\.\s/)) {
        const text = line.replace(/^\d+\.\s/, '');
        elements.push(
          <li key={`li-${index}`}>{renderInlineFormatting(text)}</li>
        );
        return;
      }

      // Regular paragraph
      elements.push(
        <p key={`p-${index}`}>{renderInlineFormatting(line)}</p>
      );
    });

    // Handle unclosed code block
    if (inCodeBlock && codeContent) {
      elements.push(
        <pre key="code-unclosed" className="gh-chat-code-block">
          <code>{codeContent}</code>
        </pre>
      );
    }

    return elements;
  };

  return <div className="gh-chat-message-text">{renderContent()}</div>;
};

/**
 * Renders inline formatting (bold, italic, code).
 */
function renderInlineFormatting(text: string): React.ReactNode {
  // Process inline code first
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const codeRegex = /`([^`]+)`/g;
  let match;

  while ((match = codeRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(processEmphasis(text.slice(lastIndex, match.index)));
    }
    // Add the code
    parts.push(
      <code key={`inline-code-${match.index}`} className="gh-chat-inline-code">
        {match[1]}
      </code>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(processEmphasis(text.slice(lastIndex)));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Processes bold and italic text.
 */
function processEmphasis(text: string): React.ReactNode {
  // Bold: **text** or __text__
  // Italic: *text* or _text_
  const result = text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');

  if (result !== text) {
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  }
  return text;
}
