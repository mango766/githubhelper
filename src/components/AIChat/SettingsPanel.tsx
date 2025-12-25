import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { Settings, AIProvider } from '../../types';

interface SettingsPanelProps {
  onClose: () => void;
  onSave: (settings: Settings) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, onSave }) => {
  const [settings, setSettings] = useState<Settings>({
    aiProvider: 'ollama',
    ollamaUrl: 'http://localhost:11434',
    geminiApiKey: '',
    selectedModel: '',
    githubToken: '',
  });

  useEffect(() => {
    const loadSettings = async () => {
      const loaded = await storageService.getSettings();
      setSettings(loaded);
    };
    loadSettings();
  }, []);

  const handleProviderChange = (provider: AIProvider) => {
    setSettings({ 
      ...settings, 
      aiProvider: provider,
      selectedModel: '', // 切换时清空模型选择
    });
  };

  return (
    <div className="gh-settings-panel">
      <div className="gh-settings-header">
        <span>设置</span>
        <button className="gh-settings-close" onClick={onClose}>✕</button>
      </div>
      
      <div className="gh-settings-content">
        {/* AI 源选择 */}
        <div className="gh-settings-section">
          <label className="gh-settings-label">AI 服务</label>
          <div className="gh-settings-radio-group">
            <label className="gh-settings-radio">
              <input
                type="radio"
                name="aiProvider"
                value="ollama"
                checked={settings.aiProvider === 'ollama'}
                onChange={() => handleProviderChange('ollama')}
              />
              <span className="gh-settings-radio-label">
                Ollama
                <span className="gh-settings-radio-desc">本地运行，完全免费</span>
              </span>
            </label>
            <label className="gh-settings-radio">
              <input
                type="radio"
                name="aiProvider"
                value="gemini"
                checked={settings.aiProvider === 'gemini'}
                onChange={() => handleProviderChange('gemini')}
              />
              <span className="gh-settings-radio-label">
                Google Gemini
                <span className="gh-settings-radio-desc">云端服务，有免费额度</span>
              </span>
            </label>
          </div>
        </div>

        {/* Ollama 配置 */}
        {settings.aiProvider === 'ollama' && (
          <div className="gh-settings-section">
            <label className="gh-settings-label">Ollama 服务地址</label>
            <input
              type="text"
              className="gh-settings-input"
              value={settings.ollamaUrl}
              onChange={(e) => setSettings({ ...settings, ollamaUrl: e.target.value })}
              placeholder="http://localhost:11434"
            />
            <p className="gh-settings-hint">
              本地 Ollama 服务的地址，需先安装并运行 Ollama
            </p>
          </div>
        )}

        {/* Gemini 配置 */}
        {settings.aiProvider === 'gemini' && (
          <div className="gh-settings-section">
            <label className="gh-settings-label">
              Gemini API Key
              <span className="gh-settings-required">*</span>
            </label>
            <input
              type="password"
              className="gh-settings-input"
              value={settings.geminiApiKey}
              onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
              placeholder="AIzaSy..."
            />
            <p className="gh-settings-hint">
              免费额度：60次/分钟，1500次/天。
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="gh-settings-link"
              >
                获取 API Key
              </a>
            </p>
          </div>
        )}

        <div className="gh-settings-divider" />

        {/* GitHub Token */}
        <div className="gh-settings-section">
          <label className="gh-settings-label">
            GitHub Token
            <span className="gh-settings-optional">(推荐)</span>
          </label>
          <input
            type="password"
            className="gh-settings-input"
            value={settings.githubToken || ''}
            onChange={(e) => setSettings({ ...settings, githubToken: e.target.value })}
            placeholder="ghp_xxxxxxxxxxxx"
          />
          <p className="gh-settings-hint">
            配置 Token 可提高 GitHub API 速率限制（60 → 5000 次/小时）。
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=GitHub%20Helper"
              target="_blank"
              rel="noopener noreferrer"
              className="gh-settings-link"
            >
              创建 Token
            </a>
          </p>
        </div>
      </div>

      <div className="gh-settings-footer">
        <button
          type="button"
          className="gh-settings-btn gh-settings-btn-save"
          onClick={() => {
            const toSave = { ...settings };
            storageService.saveSettings(toSave);
            onSave(toSave);
            onClose();
          }}
        >
          保存
        </button>
        <button 
          type="button"
          className="gh-settings-btn gh-settings-btn-cancel" 
          onClick={onClose}
        >
          取消
        </button>
      </div>
    </div>
  );
};
