import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GitHubUrlInfo, ChatMessage, ChatSession, RepoContext, AIProvider } from '../../types';
import { githubService } from '../../services/github';
import { aiService } from '../../services/ai';
import { ollamaService } from '../../services/ollama';
import { geminiService } from '../../services/gemini';
import { cacheService } from '../../services/cache';
import { storageService } from '../../services/storage';
import { generateSystemPrompt } from '../../utils/prompt';
import { ChatMessageItem } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ModelSelector } from './ModelSelector';
import { ChatHistory } from './ChatHistory';
import { SettingsPanel } from './SettingsPanel';
import { AIProviderSelector } from './AIProviderSelector';
import { Toast, ToastType } from './Toast';

interface AIChatPageProps {
  urlInfo: GitHubUrlInfo | null;
}

export const AIChatPage: React.FC<AIChatPageProps> = ({ urlInfo }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [repoContext, setRepoContext] = useState<RepoContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [aiProvider, setAiProvider] = useState<AIProvider>('ollama');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const repoKey = urlInfo ? `${urlInfo.owner}/${urlInfo.repo}` : '';

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await storageService.getSettings();
      
      // 设置 AI Provider
      const provider = settings.aiProvider || 'ollama';
      setAiProvider(provider);
      aiService.setProvider(provider);
      
      // 配置各服务
      if (settings.ollamaUrl) {
        ollamaService.setBaseUrl(settings.ollamaUrl);
      }
      if (settings.geminiApiKey) {
        geminiService.setApiKey(settings.geminiApiKey);
        setGeminiConfigured(true);
      }
      if (settings.githubToken) {
        githubService.setToken(settings.githubToken);
      }
      
      // 设置已选模型（根据当前 provider 选择对应的记忆模型）
      const modelKey = provider === 'gemini' ? 'geminiSelectedModel' : 'ollamaSelectedModel';
      const rememberedModel = settings[modelKey] || settings.selectedModel;
      if (rememberedModel) {
        setSelectedModel(rememberedModel);
      }
      
      // 标记设置已加载完成
      setSettingsLoaded(true);
    };
    loadSettings();
  }, []);

  // Load repo context when URL changes
  useEffect(() => {
    if (!urlInfo || !urlInfo.owner || !urlInfo.repo) {
      setRepoContext(null);
      return;
    }

    const loadContext = async () => {
      setContextLoading(true);
      setContextError(null);

      try {
        // Try cache first
        let context = await cacheService.getRepoContext(urlInfo.owner, urlInfo.repo);
        
        if (!context) {
          // Fetch from GitHub API
          const [info, readme, fileTree] = await Promise.all([
            githubService.getRepoInfo(urlInfo.owner, urlInfo.repo),
            githubService.getReadme(urlInfo.owner, urlInfo.repo),
            githubService.getFileTree(urlInfo.owner, urlInfo.repo, 'HEAD'),
          ]);

          context = {
            info,
            readme,
            fileTree,
            files: {},
            fetchedAt: Date.now(),
          };

          // Cache the context
          await cacheService.setRepoContext(urlInfo.owner, urlInfo.repo, context);
        }

        // If on a file page, fetch that file's content
        if (urlInfo.pageType === 'blob' && urlInfo.path && !context.files[urlInfo.path]) {
          try {
            const content = await githubService.getFileContent(
              urlInfo.owner,
              urlInfo.repo,
              urlInfo.path
            );
            context.files[urlInfo.path] = content;
            await cacheService.updateFileContent(
              urlInfo.owner,
              urlInfo.repo,
              urlInfo.path,
              content
            );
          } catch (e) {
            console.warn('Failed to fetch current file content:', e);
          }
        }

        setRepoContext(context);
      } catch (e) {
        console.error('Error loading repo context:', e);
        setContextError(e instanceof Error ? e.message : '加载仓库信息失败');
      } finally {
        setContextLoading(false);
      }
    };

    loadContext();
  }, [urlInfo?.owner, urlInfo?.repo, urlInfo?.path, urlInfo?.pageType]);

  // Create or load session when repo changes
  useEffect(() => {
    if (!repoKey) {
      setMessages([]);
      setCurrentSessionId(null);
      return;
    }

    const initSession = async () => {
      const sessions = await storageService.getChatSessions(repoKey);
      if (sessions.length > 0) {
        // Load most recent session
        const latest = sessions.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        setMessages(latest.messages);
        setCurrentSessionId(latest.id);
      } else {
        // Create new session
        const newSession: ChatSession = {
          id: crypto.randomUUID(),
          repoKey,
          title: '新对话',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await storageService.saveChatSession(newSession);
        setMessages([]);
        setCurrentSessionId(newSession.id);
      }
    };

    initSession();
  }, [repoKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const saveSession = useCallback(async (newMessages: ChatMessage[]) => {
    if (!currentSessionId || !repoKey) return;

    const session: ChatSession = {
      id: currentSessionId,
      repoKey,
      title: newMessages[0]?.content.slice(0, 50) || '新对话',
      messages: newMessages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await storageService.saveChatSession(session);
  }, [currentSessionId, repoKey]);

  const handleSend = async (content: string) => {
    if (!content.trim() || !selectedModel || !repoContext || !urlInfo) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setStreamingContent('');

    try {
      const systemPrompt = generateSystemPrompt(urlInfo, repoContext);
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...newMessages.map(m => ({ role: m.role, content: m.content })),
      ];

      abortControllerRef.current = new AbortController();
      let fullContent = '';

      for await (const chunk of aiService.chat(
        selectedModel,
        apiMessages,
        abortControllerRef.current.signal
      )) {
        fullContent += chunk;
        setStreamingContent(fullContent);
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      setStreamingContent('');
      await saveSession(finalMessages);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        // User cancelled
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: streamingContent || '(已取消)',
          timestamp: Date.now(),
        };
        const finalMessages = [...newMessages, assistantMessage];
        setMessages(finalMessages);
        setStreamingContent('');
        await saveSession(finalMessages);
      } else {
        console.error('Chat error:', e);
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `错误: ${e instanceof Error ? e.message : '请求失败'}`,
          timestamp: Date.now(),
        };
        const finalMessages = [...newMessages, errorMessage];
        setMessages(finalMessages);
        setStreamingContent('');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  const handleNewChat = async () => {
    if (!repoKey) return;
    
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      repoKey,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await storageService.saveChatSession(newSession);
    setMessages([]);
    setCurrentSessionId(newSession.id);
    setShowHistory(false);
  };

  const handleSelectSession = async (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setShowHistory(false);
  };

  // 切换 AI 源
  const handleProviderChange = async (newProvider: AIProvider) => {
    if (newProvider === aiProvider) return;

    // 保存当前 provider 的模型选择
    const currentModelKey = aiProvider === 'gemini' ? 'geminiSelectedModel' : 'ollamaSelectedModel';
    await storageService.saveSettings({ 
      [currentModelKey]: selectedModel,
      aiProvider: newProvider 
    });

    // 切换 provider
    setAiProvider(newProvider);
    aiService.setProvider(newProvider);

    // 加载新 provider 的记忆模型
    const settings = await storageService.getSettings();
    const newModelKey = newProvider === 'gemini' ? 'geminiSelectedModel' : 'ollamaSelectedModel';
    const rememberedModel = settings[newModelKey] || '';
    setSelectedModel(rememberedModel);

    setToast({ 
      message: `已切换到 ${newProvider === 'gemini' ? 'Gemini' : 'Ollama'}`, 
      type: 'success' 
    });
  };

  if (!urlInfo) {
    return (
      <div className="gh-ai-empty">
        <p>请进入 GitHub 仓库页面使用 AI 问答功能</p>
      </div>
    );
  }

  return (
    <div className="gh-ai-chat-page">
      {/* Toolbar */}
      <div className="gh-ai-toolbar">
        <AIProviderSelector
          value={aiProvider}
          onChange={handleProviderChange}
          geminiConfigured={geminiConfigured}
        />
        {settingsLoaded && (
          <ModelSelector value={selectedModel} onChange={setSelectedModel} provider={aiProvider} />
        )}
        {!settingsLoaded && (
          <div className="gh-model-selector">
            <select disabled className="gh-model-select">
              <option>加载中...</option>
            </select>
          </div>
        )}
        <button
          className="gh-ai-toolbar-btn"
          onClick={() => setShowHistory(!showHistory)}
          title="历史对话"
        >
          历史
        </button>
        <button
          className="gh-ai-toolbar-btn"
          onClick={handleNewChat}
          title="新建对话"
        >
          新建
        </button>
        <button
          className="gh-ai-toolbar-btn gh-ai-toolbar-btn-icon"
          onClick={() => setShowSettings(true)}
          title="设置"
        >
          ⚙
        </button>
      </div>

      {/* Repo Info */}
      <div className="gh-ai-repo-info">
        <span className="gh-ai-repo-name">{repoKey}</span>
        {urlInfo.path && (
          <span className="gh-ai-repo-path">/{urlInfo.path}</span>
        )}
        {contextLoading && <span className="gh-ai-loading-dot" />}
      </div>

      {/* History Panel */}
      {showHistory && (
        <ChatHistory
          repoKey={repoKey}
          currentSessionId={currentSessionId}
          onSelect={handleSelectSession}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onSave={(newSettings) => {
            // 更新 AI Provider
            const provider = newSettings.aiProvider || 'ollama';
            setAiProvider(provider);
            aiService.setProvider(provider);
            
            // 更新各服务配置
            if (newSettings.ollamaUrl) {
              ollamaService.setBaseUrl(newSettings.ollamaUrl);
            }
            if (newSettings.geminiApiKey) {
              geminiService.setApiKey(newSettings.geminiApiKey);
              setGeminiConfigured(true);
            } else {
              setGeminiConfigured(false);
            }
            if (newSettings.githubToken) {
              githubService.setToken(newSettings.githubToken);
            }
            
            // 切换 AI 源时清空模型选择
            if (newSettings.selectedModel !== selectedModel) {
              setSelectedModel(newSettings.selectedModel);
            }
            
            // 如果 GitHub Token 变化，清除缓存
            cacheService.clearCache(urlInfo?.owner || '', urlInfo?.repo || '');
            
            // 关闭设置页并显示成功提示
            setShowSettings(false);
            setToast({ message: '设置已保存', type: 'success' });
          }}
        />
      )}

      {/* Toast 提示 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Context Error */}
      {contextError && (
        <div className="gh-ai-context-error">
          {contextError}
        </div>
      )}

      {/* Messages */}
      <div className="gh-ai-messages">
        {messages.length === 0 && !isLoading && (
          <div className="gh-ai-welcome">
            <p>你好！我可以帮助你理解这个仓库。</p>
            <p>试着问我关于代码结构、功能实现或任何问题。</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}
        
        {streamingContent && (
          <ChatMessageItem
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              timestamp: Date.now(),
            }}
            isStreaming
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isLoading={isLoading}
        disabled={!selectedModel || contextLoading}
        placeholder={
          !selectedModel
            ? '请先选择模型...'
            : contextLoading
            ? '正在加载仓库信息...'
            : '输入问题...'
        }
      />
    </div>
  );
};
