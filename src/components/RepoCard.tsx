import React from 'react';
import { Repository, formatNumber, formatDate, languageColors } from '../utils/api';
import { RepoIcon, StarIcon, ForkIcon, ClockIcon } from './Icons';

interface RepoCardProps {
  repo: Repository;
  selected?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
  showCheckbox?: boolean;
}

export const RepoCard: React.FC<RepoCardProps> = ({ 
  repo, 
  selected = false, 
  onSelect,
  showCheckbox = false 
}) => {
  const languageColor = repo.language ? languageColors[repo.language] || '#8b8b8b' : null;

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(repo.id, e.target.checked);
  };

  return (
    <div className={`gh-repo-card ${selected ? 'gh-repo-card-selected' : ''}`}>
      <div className="gh-repo-card-content">
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

      {showCheckbox && (
        <div className="gh-repo-checkbox-wrapper">
          <input
            type="checkbox"
            className="gh-repo-checkbox"
            checked={selected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
