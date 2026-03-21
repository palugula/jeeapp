import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, StickyNote, ChevronDown, ChevronRight, Trash2, Clock, Play } from 'lucide-react';
import { getSubjectNotes, deleteNote } from '../lib/api.js';
import VideoPlayer from '../components/player/VideoPlayer.jsx';

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Single note row — timestamp is clickable when item has video
function NoteRow({ note, item, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [playerItem, setPlayerItem] = useState(null);

  const hasTimestamp = note.timestamp !== null && note.timestamp !== undefined;
  const canSeek = hasTimestamp && item && (item.itemType === 'local_video' || item.itemType === 'youtube' || item.itemType === 'manual');

  const handleTimestampClick = () => {
    if (!canSeek) return;
    setPlayerItem({ ...item, currentTime: note.timestamp });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteNote(note._id);
      onDelete(note._id);
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        className="flex items-start gap-3 p-3 rounded-lg group transition-colors hover:bg-opacity-80"
        style={{ background: '#1A2234' }}
      >
        {/* Timestamp badge — clickable if video available */}
        <div className="flex-shrink-0 mt-0.5 w-16">
          {hasTimestamp ? (
            <button
              onClick={handleTimestampClick}
              disabled={!canSeek}
              title={canSeek ? `Jump to ${formatTime(note.timestamp)}` : 'No video'}
              className={`flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded w-full justify-center transition-colors ${
                canSeek
                  ? 'hover:bg-primary text-primary border border-primary/40 hover:text-white cursor-pointer'
                  : 'text-text-muted border border-transparent cursor-default'
              }`}
            >
              <Clock size={9} />
              {formatTime(note.timestamp)}
            </button>
          ) : (
            <span className="text-xs text-text-muted pl-1">—</span>
          )}
        </div>

        {/* Content */}
        <p className="flex-1 text-sm text-text-card leading-relaxed">{note.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {canSeek && (
            <button
              onClick={handleTimestampClick}
              className="p-1 rounded text-text-muted hover:text-primary transition-colors"
              title="Open video at this time"
            >
              <Play size={12} />
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1 rounded text-text-muted hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* VideoPlayer spawned at note timestamp */}
      {playerItem && (
        <VideoPlayer
          item={playerItem}
          onClose={() => setPlayerItem(null)}
          onComplete={() => setPlayerItem(null)}
        />
      )}
    </>
  );
}

function ItemSection({ itemGroup, onDeleteNote }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#262C36' }}>
      {/* Item header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-accent transition-colors"
        style={{ background: '#161B22' }}
      >
        {open
          ? <ChevronDown size={13} className="text-text-muted flex-shrink-0" />
          : <ChevronRight size={13} className="text-text-muted flex-shrink-0" />}
        <StickyNote size={13} className="text-primary flex-shrink-0" />
        <span className="text-sm font-medium text-text-card flex-1 truncate">
          {itemGroup.itemName}
        </span>
        <span className="text-xs text-text-muted flex-shrink-0 ml-2">
          {itemGroup.notes.length} {itemGroup.notes.length === 1 ? 'note' : 'notes'}
        </span>
      </button>

      {/* Scrollable notes list */}
      {open && (
        <div
          className="overflow-y-auto"
          style={{ background: '#0F1117', maxHeight: '340px' }}
        >
          <div className="p-2 space-y-1.5">
            {itemGroup.notes.map(note => (
              <NoteRow
                key={note._id}
                note={note}
                item={itemGroup.item}
                onDelete={onDeleteNote}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChapterSection({ chapter, onDeleteNote }) {
  const [open, setOpen] = useState(true);
  const totalNotes = chapter.items.reduce((s, i) => s + i.notes.length, 0);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: '#161B22', borderColor: '#262C36' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-accent transition-colors"
      >
        {open
          ? <ChevronDown size={15} className="text-text-muted flex-shrink-0" />
          : <ChevronRight size={15} className="text-text-muted flex-shrink-0" />}
        <h3 className="font-semibold text-text-card flex-1 text-left truncate">
          {chapter.chapterName}
        </h3>
        <span className="text-xs text-text-muted flex-shrink-0 ml-2">
          {chapter.items.length} items · {totalNotes} notes
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {chapter.items.map(itemGroup => (
            <ItemSection
              key={itemGroup.itemId}
              itemGroup={itemGroup}
              onDeleteNote={onDeleteNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SubjectNotesPage() {
  const { subject } = useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getSubjectNotes(subject);
      setChapters(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [subject]);

  const handleDeleteNote = (noteId) => {
    setChapters(prev =>
      prev.map(ch => ({
        ...ch,
        items: ch.items
          .map(it => ({ ...it, notes: it.notes.filter(n => n._id !== noteId) }))
          .filter(it => it.notes.length > 0)
      })).filter(ch => ch.items.length > 0)
    );
  };

  const totalNotes = chapters.reduce((s, ch) =>
    s + ch.items.reduce((si, it) => si + it.notes.length, 0), 0
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(`/subject/${subject}`)}
        className="flex items-center gap-2 text-text-muted hover:text-text-card transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back to {subject}
      </button>

      {/* Header */}
      <div className="rounded-xl p-5 border" style={{ background: '#161B22', borderColor: '#262C36' }}>
        <h1 className="text-2xl font-bold text-text-card">{subject} — Study Notes</h1>
        <p className="text-text-muted text-sm mt-1">
          {totalNotes} notes across {chapters.length} chapters
        </p>
        <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
          <Clock size={11} />
          Click a timestamp badge to open the video at that exact moment
        </p>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: '#161B22' }} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && chapters.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <StickyNote size={44} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No notes yet</p>
          <p className="text-sm mt-1">Open a lecture and add notes while watching.</p>
        </div>
      )}

      {/* Chapter → Item → Notes */}
      {!loading && chapters.map(chapter => (
        <ChapterSection
          key={chapter.chapterId}
          chapter={chapter}
          onDeleteNote={handleDeleteNote}
        />
      ))}
    </div>
  );
}
