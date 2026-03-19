import React, { useState, useEffect } from 'react';
import { Clock, Video, FileText, BookOpen, TrendingUp } from 'lucide-react';
import { getAnalytics, getHeatmap } from '../lib/api.js';
import HeatMap from '../components/dashboard/HeatMap.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';

const SUBJECT_COLORS = { Maths: '#6366F1', Physics: '#10B981', Chemistry: '#F59E0B' };

function StatCard({ icon: Icon, label, value, color = '#6366F1' }) {
  return (
    <div className="rounded-xl p-5 border flex items-center gap-4" style={{ background: '#161B22', borderColor: '#262C36' }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-text-card">{value}</p>
        <p className="text-sm text-text-muted">{label}</p>
      </div>
    </div>
  );
}

const CONFIDENCE_COLORS = { high: '#10B981', moderate: '#F59E0B', low: '#EF4444' };

export default function Analytics() {
  const [data, setData] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAnalytics(), getHeatmap()])
      .then(([analyticsData, heatmapData]) => {
        setData(analyticsData);
        setHeatmap(heatmapData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: '#161B22' }} />
          ))}
        </div>
      </div>
    );
  }

  const { overview = {}, subjectStats = [], chapterStats = [] } = data || {};

  const totalProgress = overview.totalItems > 0
    ? Math.round((overview.completedItems / overview.totalItems) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-card">Analytics</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Study Hours" value={overview.totalHours || 0} color="#6366F1" />
        <StatCard icon={Video} label="Videos Done" value={overview.videosCompleted || 0} color="#10B981" />
        <StatCard icon={FileText} label="PDFs Done" value={overview.pdfsCompleted || 0} color="#F59E0B" />
        <StatCard icon={TrendingUp} label="Overall Progress" value={`${totalProgress}%`} color="#EC4899" />
      </div>

      {/* Heatmap */}
      <div className="rounded-xl p-6 border" style={{ background: '#161B22', borderColor: '#262C36' }}>
        <h2 className="text-lg font-bold text-text-card mb-4">Study Activity (Last 12 Weeks)</h2>
        <HeatMap data={heatmap} />
      </div>

      {/* Subject Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {subjectStats.map(s => {
          const color = SUBJECT_COLORS[s.subject] || '#6366F1';
          return (
            <div key={s.subject} className="rounded-xl p-5 border" style={{ background: '#161B22', borderColor: '#262C36' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-text-card">{s.subject}</h3>
                <span className="text-lg font-bold" style={{ color }}>{s.progress}%</span>
              </div>
              <ProgressBar value={s.progress} color={color} height={6} />
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-text-muted">
                <div>
                  <p className="font-medium text-text-secondary">{s.chapterCount}</p>
                  <p>Chapters</p>
                </div>
                <div>
                  <p className="font-medium text-text-secondary">{s.completedItems}/{s.totalItems}</p>
                  <p>Items done</p>
                </div>
                <div>
                  <p className="font-medium text-text-secondary">{s.studyHours}h</p>
                  <p>Study time</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chapter Completion Grid */}
      <div className="rounded-xl p-6 border" style={{ background: '#161B22', borderColor: '#262C36' }}>
        <h2 className="text-lg font-bold text-text-card mb-4">Chapter Status</h2>
        {['Maths', 'Physics', 'Chemistry'].map(subject => {
          const chapters = chapterStats.filter(c => c.subject === subject);
          if (!chapters.length) return null;
          const color = SUBJECT_COLORS[subject];

          return (
            <div key={subject} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-text-secondary mb-3" style={{ color }}>{subject}</h3>
              <div className="space-y-2">
                {chapters.map(chapter => (
                  <div key={chapter._id} className="flex items-center gap-3">
                    <div className="w-40 truncate text-sm text-text-card" title={chapter.name}>
                      {chapter.name}
                    </div>
                    <ProgressBar value={chapter.progress} color={color} height={6} className="flex-1" />
                    <span className="text-xs text-text-muted w-10 text-right">{chapter.progress}%</span>
                    {chapter.confidence && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: CONFIDENCE_COLORS[chapter.confidence] || '#64748B' }}
                        title={`Confidence: ${chapter.confidence}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
