import React from 'react';

export default function ProgressBar({ value = 0, max = 100, color = '#6366F1', height = 6, showLabel = false, className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height, background: '#262C36' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-text-muted w-8 text-right">{Math.round(pct)}%</span>
      )}
    </div>
  );
}
