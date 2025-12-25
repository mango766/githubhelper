import React from 'react';
import { Repository, formatNumber, formatDate, languageColors } from '../utils/api';
import { RepoIcon, StarIcon, ForkIcon, ClockIcon } from './Icons';

interface RepoCardProps {
  repo: Repository;
}

export const RepoCard: React.FC<RepoCardProps> = ({ repo }) => {
  const languageColor = repo.language ? languageColors[repo.language] || '#8b8b8b' : null;

  return (
    <div className="gh-repo-card">
      <div className="gh-repo-header">
        <RepoIcon className="gh-repo-icon" />
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="gh-repo-name"
        >
          {repo.full_name}
        </a>
      </div>

      {repo.description && (
        <p className="gh-repo-desc">{repo.description}</p>
      )}

      <div className="gh-repo-meta">
        {repo.language && (
          <span className="gh-repo-meta-item">
            <span
              className="gh-language-dot"
              style={{ backgroundColor: languageColor || '#8b8b8b' }}
            />
            {repo.language}
          </span>
        )}

        <span className="gh-repo-meta-item">
          <StarIcon />
          {formatNumber(repo.stargazers_count)}
        </span>

        <span className="gh-repo-meta-item">
          <ForkIcon />
          {formatNumber(repo.forks_count)}
        </span>

        <span className="gh-repo-meta-item">
          <ClockIcon />
          {formatDate(repo.updated_at)}
        </span>
      </div>
    </div>
  );
};
