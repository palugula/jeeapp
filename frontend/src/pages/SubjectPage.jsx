import React from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useSubjectChapters } from '../hooks/useSubjects.js';
import ChapterList from '../components/chapters/ChapterList.jsx';
import ProgressBar from '../components/common/ProgressBar.jsx';

const SUBJECT_COLORS = {
  Maths: '#6366F1',
  Physics: '#10B981',
  Chemistry: '#F59E0B'
};

const SUBJECT_EMOJI = {
  Maths: '📐',
  Physics: '⚛️',
  Chemistry: '🧪'
};

export default function SubjectPage() {
  const { subject } = useParams();
  const { chapters, loading, error, reload, rescan } = useSubjectChapters(subject);
  const color = SUBJECT_COLORS[subject] || '#6366F1';

  const totalLectures = chapters.reduce((sum, c) => sum + (c.stats?.totalLectures ?? c.stats?.lectureCount ?? 0), 0);
  const completedLectures = chapters.reduce((sum, c) => sum + (c.stats?.completedLectures ?? 0), 0);
  const overallProgress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-xl p-6 border" style={{ background: '#161B22', borderColor: '#262C36' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{SUBJECT_EMOJI[subject] || '📚'}</span>
            <div>
              <h1 className="text-2xl font-bold text-text-card">{subject}</h1>
              <p className="text-text-muted text-sm">
                {chapters.length} chapters • {completedLectures}/{totalLectures} lectures completed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={rescan}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-accent text-text-secondary"
              style={{ borderColor: '#262C36' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Rescan Files
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-text-muted mb-1">
            <span>Overall Progress</span>
            <span>{overallProgress}%</span>
          </div>
          <ProgressBar value={overallProgress} color={color} height={8} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-red-800 text-red-400" style={{ background: '#1a0a0a' }}>
          <AlertCircle size={16} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && !chapters.length && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: '#161B22' }} />
          ))}
        </div>
      )}

      {/* Chapter List */}
      {!loading && (
        <ChapterList
          chapters={chapters}
          subject={subject}
          onReload={reload}
        />
      )}
    </div>
  );
}
