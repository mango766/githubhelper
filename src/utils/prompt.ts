import { GitHubUrlInfo, RepoContext, FileTreeNode } from '../types';

/**
 * Formats file tree into a readable string representation.
 */
function formatFileTree(nodes: FileTreeNode[], maxItems = 100): string {
  const sorted = [...nodes].sort((a, b) => {
    // Directories first, then files
    if (a.type !== b.type) {
      return a.type === 'tree' ? -1 : 1;
    }
    return a.path.localeCompare(b.path);
  });

  const limited = sorted.slice(0, maxItems);
  const lines = limited.map(node => {
    const prefix = node.type === 'tree' ? '📁 ' : '📄 ';
    return `${prefix}${node.path}`;
  });

  if (sorted.length > maxItems) {
    lines.push(`... 还有 ${sorted.length - maxItems} 个文件`);
  }

  return lines.join('\n');
}

/**
 * Generates the system prompt for AI chat based on current context.
 */
export function generateSystemPrompt(
  urlInfo: GitHubUrlInfo,
  repoContext: RepoContext
): string {
  const { owner, repo, pageType, path } = urlInfo;
  const { info, readme, fileTree, files } = repoContext;

  let prompt = `你是一个专业的 GitHub 仓库助手，帮助用户理解代码和项目。请用中文回答，保持专业、简洁。

## 当前仓库信息
- **名称**: ${owner}/${repo}
- **描述**: ${info.description || '无描述'}
- **主要语言**: ${info.language || '未知'}
- **Stars**: ${info.stars}

## 当前浏览位置
- **页面类型**: ${getPageTypeLabel(pageType)}
${path ? `- **路径**: ${path}` : ''}

## 仓库文件结构
\`\`\`
${formatFileTree(fileTree)}
\`\`\`
`;

  // Add README content (truncated if too long)
  if (readme) {
    const truncatedReadme = readme.length > 3000 
      ? readme.slice(0, 3000) + '\n\n... (README 内容已截断)'
      : readme;
    prompt += `
## README 内容
${truncatedReadme}
`;
  }

  // Add current file content if on a file page
  if (pageType === 'blob' && path && files[path]) {
    const fileContent = files[path];
    const truncatedContent = fileContent.length > 8000
      ? fileContent.slice(0, 8000) + '\n\n... (文件内容已截断)'
      : fileContent;
    
    prompt += `
## 当前查看的文件 (${path})
\`\`\`
${truncatedContent}
\`\`\`
`;
  }

  // Add directory listing if on a tree page
  if (pageType === 'tree' && path) {
    const dirFiles = fileTree.filter(f => {
      const filePath = f.path;
      return filePath.startsWith(path + '/') && 
             !filePath.slice(path.length + 1).includes('/');
    });
    
    if (dirFiles.length > 0) {
      prompt += `
## 当前目录内容 (${path})
${dirFiles.map(f => `- ${f.type === 'tree' ? '📁' : '📄'} ${f.path.split('/').pop()}`).join('\n')}
`;
    }
  }

  prompt += `
## 回答指南
1. 根据用户问题，结合以上仓库信息进行回答
2. 如果需要查看其他文件才能准确回答，请告诉用户具体的文件路径
3. 解释代码时，可以引用具体的文件和行号
4. 如果不确定某些信息，请诚实说明
5. 回答要简洁明了，避免冗余
`;

  return prompt;
}

/**
 * Gets human-readable label for page type.
 */
function getPageTypeLabel(pageType: GitHubUrlInfo['pageType']): string {
  const labels: Record<GitHubUrlInfo['pageType'], string> = {
    home: '仓库主页',
    tree: '目录浏览',
    blob: '文件查看',
    issues: 'Issues',
    pulls: 'Pull Requests',
    other: '其他页面',
  };
  return labels[pageType] || '未知';
}
