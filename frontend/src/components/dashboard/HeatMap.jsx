import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';

const LEVEL_COLORS = {
  0: '#1E293B',
  1: '#312e81',
  2: '#4338CA',
  3: '#6366F1',
  4: '#818CF8'
};

function HeatmapCell({ data }) {
  const [tooltip, setTooltip] = useState(false);
  const color = LEVEL_COLORS[data.level] || LEVEL_COLORS[0];

  return (
    <div className="relative" onMouseEnter={() => setTooltip(true)} onMouseLeave={() => setTooltip(false)}>
      <div
        className="heatmap-cell cursor-default"
        style={{
          width: 12,
          height: 12,
          background: color,
          borderRadius: 2
        }}
      />
      {tooltip && (
        <div
          className="absolute z-50 px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none"
          style={{
            background: '#1F2937',
            color: '#F1F5F9',
            border: '1px solid #262C36',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 4
          }}
        >
          {data.date}: {data.minutes} min
        </div>
      )}
    </div>
  );
}

export default function HeatMap({ data = [], compact = false }) {
  if (!data.length) {
    return (
      <div className="text-center py-8 text-text-muted text-sm">
        No study activity yet. Start studying to see your heatmap!
      </div>
    );
  }

  // Group by week (columns) and day (rows)
  const weeks = [];
  let week = [];

  for (let i = 0; i < data.length; i++) {
    const d = parseISO(data[i].date);
    const dayOfWeek = d.getDay(); // 0 = Sunday

    if (i === 0) {
      // Pad the first week
      for (let p = 0; p < dayOfWeek; p++) {
        week.push(null);
      }
    }

    week.push(data[i]);

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Month labels
  const monthLabels = [];
  let lastMonth = '';
  weeks.forEach((w, wi) => {
    const firstDay = w.find(d => d !== null);
    if (firstDay) {
      const month = format(parseISO(firstDay.date), 'MMM');
      if (month !== lastMonth) {
        monthLabels.push({ index: wi, label: month });
        lastMonth = month;
      }
    }
  });

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1">
        {/* Day labels */}
        {!compact && (
          <div className="flex flex-col justify-around pr-2" style={{ gap: 1 }}>
            {dayLabels.map((d, i) => (
              <div key={d} className="text-xs text-text-muted" style={{ height: 12, lineHeight: '12px', visibility: i % 2 === 0 ? 'visible' : 'hidden' }}>
                {d}
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="flex flex-col">
          {/* Month labels */}
          {!compact && (
            <div className="flex relative h-4 mb-1">
              {monthLabels.map(({ index, label }) => (
                <div
                  key={`${index}-${label}`}
                  className="absolute text-xs text-text-muted"
                  style={{ left: index * 13 }}
                >
                  {label}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  day ? (
                    <HeatmapCell key={di} data={day} />
                  ) : (
                    <div key={di} style={{ width: 12, height: 12 }} />
                  )
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      {!compact && (
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-text-muted">Less</span>
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className="rounded"
              style={{ width: 12, height: 12, background: LEVEL_COLORS[level] }}
            />
          ))}
          <span className="text-xs text-text-muted">More</span>
        </div>
      )}
    </div>
  );
}
