import React from 'react';
import ChapterCard from './ChapterCard.jsx';
import { reorderChapters } from '../../lib/api.js';

export default function ChapterList({ chapters, subject, onReload }) {
  const handleMoveUp = async (index) => {
    if (index === 0) return;
    const newChapters = [...chapters];
    [newChapters[index], newChapters[index - 1]] = [newChapters[index - 1], newChapters[index]];
    const items = newChapters.map((c, i) => ({ id: c._id, order: i }));
    await reorderChapters(subject, items);
    onReload();
  };

  const handleMoveDown = async (index) => {
    if (index === chapters.length - 1) return;
    const newChapters = [...chapters];
    [newChapters[index], newChapters[index + 1]] = [newChapters[index + 1], newChapters[index]];
    const items = newChapters.map((c, i) => ({ id: c._id, order: i }));
    await reorderChapters(subject, items);
    onReload();
  };

  if (!chapters.length) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p className="text-lg mb-2">No chapters found</p>
        <p className="text-sm">Add content folders to your study-content directory and rescan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chapters.map((chapter, index) => (
        <ChapterCard
          key={chapter._id}
          chapter={chapter}
          index={index}
          total={chapters.length}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onReload={onReload}
        />
      ))}
    </div>
  );
}
