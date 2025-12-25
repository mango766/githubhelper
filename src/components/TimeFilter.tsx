import React from 'react';
import { TimeRange } from '../hooks/useGitHubSearch';

interface TimeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  disabled?: boolean;
}

const timeOptions: { value: TimeRange; label: string }[] = [
  { value: 'week', label: '本周热榜' },
  { value: 'month', label: '本月热榜' },
  { value: 'all', label: '历史热榜' },
];

export const TimeFilter: React.FC<TimeFilterProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="gh-time-filter">
      {timeOptions.map((option) => (
        <button
          key={option.value}
          className={`gh-time-btn ${value === option.value ? 'active' : ''}`}
          onClick={() => onChange(option.value)}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
