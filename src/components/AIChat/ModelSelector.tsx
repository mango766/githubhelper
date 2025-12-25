import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../../services/ai';
import { storageService } from '../../services/storage';
import { AIProvider } from '../../types';

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
  provider: AIProvider;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ value, onChange, provider }) => {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 使用 ref 保存最新的 onChange，避免依赖数组问题
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const isConnected = await aiService.checkConnection();
        if (!isConnected) {
          const errorMsg = provider === 'gemini' 
            ? '请配置有效的 Gemini API Key' 
            : '无法连接到 Ollama';
          setError(errorMsg);
          setModels([]);
          return;
        }

        const modelList = await aiService.getModels();
        setModels(modelList);

        // 自动选择模型：如果当前没有选中或选中的不在列表中
        if (modelList.length > 0) {
          // 从 storage 获取最新的已保存模型
          const settings = await storageService.getSettings();
          const savedModel = settings.selectedModel;
          
          if (savedModel && modelList.includes(savedModel)) {
            // 已保存的模型在列表中，使用它
            onChangeRef.current(savedModel);
          } else {
            // 否则选择第一个
            onChangeRef.current(modelList[0]);
            await storageService.saveSettings({ selectedModel: modelList[0] });
          }
        }
      } catch (e) {
        console.error('Error fetching models:', e);
        setError('获取模型列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [provider]); // 当 provider 变化时重新获取模型

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const model = e.target.value;
    onChange(model);
    await storageService.saveSettings({ selectedModel: model });
  };

  const providerLabel = provider === 'gemini' ? 'Gemini' : 'Ollama';

  if (loading) {
    return (
      <div className="gh-model-selector">
        <select disabled className="gh-model-select">
          <option>加载中...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gh-model-selector">
        <select disabled className="gh-model-select gh-model-select-error">
          <option>{error}</option>
        </select>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="gh-model-selector">
        <select disabled className="gh-model-select">
          <option>无可用模型</option>
        </select>
      </div>
    );
  }

  return (
    <div className="gh-model-selector">
      <select
        className="gh-model-select"
        value={value}
        onChange={handleChange}
        title={`当前使用: ${providerLabel}`}
      >
        {models.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  );
};
