import React, { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove
} from '@dnd-kit/sortable';
import ChapterCard from './ChapterCard.jsx';
import { reorderChapters } from '../../lib/api.js';

export default function ChapterList({ chapters, subject, onReload }) {
  const [localChapters, setLocalChapters] = useState(chapters);

  // Keep in sync when parent reloads
  React.useEffect(() => { setLocalChapters(chapters); }, [chapters]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localChapters.findIndex(c => c._id === active.id);
    const newIndex = localChapters.findIndex(c => c._id === over.id);
    const reordered = arrayMove(localChapters, oldIndex, newIndex);
    setLocalChapters(reordered);

    try {
      const items = reordered.map((c, i) => ({ id: c._id, order: i }));
      await reorderChapters(subject, items);
      onReload();
    } catch (err) {
      console.error(err);
      setLocalChapters(chapters); // revert on error
    }
  };

  if (!localChapters.length) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p className="text-lg mb-2">No chapters found</p>
        <p className="text-sm">Add content folders to your study-content directory and rescan.</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={localChapters.map(c => c._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {localChapters.map((chapter, index) => (
            <ChapterCard key={chapter._id} chapter={chapter} index={index} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
