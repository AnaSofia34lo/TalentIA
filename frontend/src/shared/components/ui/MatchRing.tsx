import React from 'react';

interface MatchRingProps {
  percentage: number;
  size?: number;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

export function MatchRing({
  percentage,
  size = 40,
  label = 'Match IA',
  showLabel = false,
  className = ''
}: MatchRingProps) {
  const color = percentage >= 85 ? 'var(--green)' : percentage >= 70 ? 'var(--purple)' : 'var(--red)';
  const ringStyle = {
    width: `${size}px`,
    height: `${size}px`,
    background: `conic-gradient(${color} 0 ${percentage}%, var(--line) ${percentage}% 100%)`
  };

  const fontSize = Math.max(10, Math.round(size * 0.23));
  const subFontSize = Math.max(9, Math.round(size * 0.1));

  return (
    <div className={`ring ${className}`} style={ringStyle}>
      <div className="ring-inner">
        <b style={{ fontSize: `${fontSize}px`, color: 'var(--navy)', lineHeight: 1.1 }}>
          {percentage}%
        </b>
        {showLabel && (
          <span style={{ fontSize: `${subFontSize}px`, marginTop: '2px' }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
