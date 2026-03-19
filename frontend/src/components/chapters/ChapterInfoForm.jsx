import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import { updateChapter } from '../../lib/api.js';

export default function ChapterInfoForm({ chapter, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    eisenhowerLabel: chapter.eisenhowerLabel || '',
    referenceBook: chapter.referenceBook || '',
    referenceBookProgress: chapter.referenceBookProgress || 0,
    coachingModuleDone: chapter.coachingModuleDone || false,
    pyqsDone: chapter.pyqsDone || 0,
    confidence: chapter.confidence || '',
    notesPerfection: chapter.notesPerfection || ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateChapter(chapter._id, form);
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: '#161B22', borderColor: '#262C36' }}>
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-text-card">Chapter Info</span>
        {open ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>

      {open && (
        <div className="border-t p-4 space-y-4" style={{ borderColor: '#262C36' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-secondary block mb-1">Eisenhower Label</label>
              <select
                value={form.eisenhowerLabel}
                onChange={e => handleChange('eisenhowerLabel', e.target.value || null)}
              >
                <option value="">None</option>
                <option value="hard_high_weight">Hard / High Weight</option>
                <option value="easy_high_weight">Easy / High Weight</option>
                <option value="hard_low_weight">Hard / Low Weight</option>
                <option value="easy_low_weight">Easy / Low Weight</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-text-secondary block mb-1">Confidence Level</label>
              <select
                value={form.confidence}
                onChange={e => handleChange('confidence', e.target.value || null)}
              >
                <option value="">None</option>
                <option value="high">High</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-text-secondary block mb-1">Notes Perfection</label>
              <select
                value={form.notesPerfection}
                onChange={e => handleChange('notesPerfection', e.target.value || null)}
              >
                <option value="">None</option>
                <option value="completed">Completed</option>
                <option value="few_pendings">Few Pendings</option>
                <option value="many_pendings">Many Pendings</option>
                <option value="not_started">Not Started</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-text-secondary block mb-1">Reference Book</label>
              <input
                type="text"
                value={form.referenceBook}
                onChange={e => handleChange('referenceBook', e.target.value)}
                placeholder="Book name..."
              />
            </div>

            <div>
              <label className="text-sm text-text-secondary block mb-1">
                Reference Book Progress ({form.referenceBookProgress}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={form.referenceBookProgress}
                onChange={e => handleChange('referenceBookProgress', parseInt(e.target.value))}
                className="w-full accent-primary"
                style={{ padding: 0, border: 'none', background: 'transparent' }}
              />
            </div>

            <div>
              <label className="text-sm text-text-secondary block mb-1">PYQs Done</label>
              <input
                type="number"
                min="0"
                value={form.pyqsDone}
                onChange={e => handleChange('pyqsDone', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.coachingModuleDone}
                onChange={e => handleChange('coachingModuleDone', e.target.checked)}
                className="w-4 h-4 accent-primary"
                style={{ width: 'auto', border: 'none', padding: 0 }}
              />
              <span className="text-sm text-text-secondary">Coaching Module Done</span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary transition-opacity"
              style={{ opacity: saving ? 0.6 : 1 }}
            >
              <Save size={14} />
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
