import React, { useState, useEffect } from 'react';
import { format, addWeeks, subWeeks, parseISO, startOfWeek, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Check, Clock } from 'lucide-react';
import { getWeekPlan, saveWeekPlan, getSubjectChapters, estimateTime } from '../lib/api.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SUBJECTS = ['Maths', 'Physics', 'Chemistry'];
const SUBJECT_COLORS = { Maths: '#6366F1', Physics: '#10B981', Chemistry: '#F59E0B' };

function getWeekStart(date) {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

function AddItemModal({ date, onClose, onAdd }) {
  const [subject, setSubject] = useState('Maths');
  const [chapters, setChapters] = useState([]);
  const [chapterId, setChapterId] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [itemName, setItemName] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSubjectChapters(subject).then(data => {
      setChapters(data);
      if (data.length) { setChapterId(data[0]._id); setChapterName(data[0].name); }
    }).catch(console.error);
  }, [subject]);

  const handleChapterChange = async (e) => {
    const ch = chapters.find(c => c._id === e.target.value);
    if (!ch) return;
    setChapterId(ch._id);
    setChapterName(ch.name);
    try {
      const est = await estimateTime({ chapterId: ch._id });
      setEstimatedMinutes(est.estimatedMinutes || 60);
    } catch {}
  };

  const handleAdd = () => {
    if (!chapterId) return;
    onAdd({
      date,
      chapterId,
      subject,
      chapterName,
      itemName,
      estimatedMinutes,
      completed: false
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="w-full max-w-sm rounded-xl p-6 border" style={{ background: '#1F2937', borderColor: '#262C36' }}>
        <h3 className="text-lg font-bold text-text-card mb-4">Add to {format(parseISO(date), 'EEEE, MMM d')}</h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Chapter</label>
            <select value={chapterId} onChange={handleChapterChange}>
              {chapters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Notes (optional)</label>
            <input
              type="text"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder="Specific topic or item..."
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Estimated Minutes</label>
            <input
              type="number"
              min="5"
              value={estimatedMinutes}
              onChange={e => setEstimatedMinutes(parseInt(e.target.value) || 60)}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm border text-text-secondary hover:bg-accent transition-colors" style={{ borderColor: '#262C36' }}>
            Cancel
          </button>
          <button onClick={handleAdd} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WeeklyPlan() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(null); // date string or null

  const weekStart = getWeekStart(currentWeek);

  useEffect(() => {
    setLoading(true);
    getWeekPlan(weekStart)
      .then(data => {
        if (!data.plans || !data.plans.length) {
          // Create empty week
          const plans = [];
          for (let i = 0; i < 7; i++) {
            const date = format(addDays(parseISO(weekStart), i), 'yyyy-MM-dd');
            plans.push({ date, items: [] });
          }
          setPlan({ weekStart, plans });
        } else {
          setPlan(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [weekStart]);

  const savePlan = async (updatedPlan) => {
    try {
      await saveWeekPlan(weekStart, updatedPlan.plans);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = (newItem) => {
    setPlan(prev => {
      const updated = {
        ...prev,
        plans: prev.plans.map(day => {
          if (day.date !== newItem.date) return day;
          return {
            ...day,
            items: [...(day.items || []), {
              ...newItem,
              _id: Date.now().toString()
            }]
          };
        })
      };
      savePlan(updated);
      return updated;
    });
  };

  const handleToggleItem = (date, itemIndex) => {
    setPlan(prev => {
      const updated = {
        ...prev,
        plans: prev.plans.map(day => {
          if (day.date !== date) return day;
          const items = [...(day.items || [])];
          items[itemIndex] = { ...items[itemIndex], completed: !items[itemIndex].completed };
          return { ...day, items };
        })
      };
      savePlan(updated);
      return updated;
    });
  };

  const handleRemoveItem = (date, itemIndex) => {
    setPlan(prev => {
      const updated = {
        ...prev,
        plans: prev.plans.map(day => {
          if (day.date !== date) return day;
          const items = day.items.filter((_, i) => i !== itemIndex);
          return { ...day, items };
        })
      };
      savePlan(updated);
      return updated;
    });
  };

  const weekDays = plan?.plans || [];
  const totalMinutes = weekDays.reduce((sum, d) => sum + (d.items || []).reduce((s, i) => s + (i.estimatedMinutes || 0), 0), 0);
  const completedItems = weekDays.reduce((sum, d) => sum + (d.items || []).filter(i => i.completed).length, 0);
  const totalItems = weekDays.reduce((sum, d) => sum + (d.items || []).length, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-card">Weekly Plan</h1>
          <p className="text-text-muted text-sm mt-1">
            Week of {format(parseISO(weekStart), 'MMM d')} – {format(addDays(parseISO(weekStart), 6), 'MMM d, yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Clock size={14} />
            <span>{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m planned</span>
            <span>•</span>
            <span>{completedItems}/{totalItems} done</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentWeek(w => subWeeks(w, 1))}
              className="p-2 rounded-lg hover:bg-accent text-text-muted hover:text-text-card transition-colors border"
              style={{ borderColor: '#262C36' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-1.5 rounded-lg text-sm text-text-secondary border hover:bg-accent transition-colors"
              style={{ borderColor: '#262C36' }}
            >
              Today
            </button>
            <button
              onClick={() => setCurrentWeek(w => addWeeks(w, 1))}
              className="p-2 rounded-lg hover:bg-accent text-text-muted hover:text-text-card transition-colors border"
              style={{ borderColor: '#262C36' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="grid grid-cols-7 gap-3">
          {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-64 rounded-xl animate-pulse" style={{ background: '#161B22' }} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDays.map((day, di) => {
            const date = parseISO(day.date);
            const isToday = format(new Date(), 'yyyy-MM-dd') === day.date;
            const items = day.items || [];
            const dayMinutes = items.reduce((s, i) => s + (i.estimatedMinutes || 0), 0);

            return (
              <div
                key={day.date}
                className="rounded-xl border overflow-hidden"
                style={{
                  background: '#161B22',
                  borderColor: isToday ? '#6366F1' : '#262C36'
                }}
              >
                {/* Day header */}
                <div
                  className="px-3 py-2 text-center border-b"
                  style={{
                    background: isToday ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    borderColor: '#262C36'
                  }}
                >
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-primary' : 'text-text-muted'}`}>
                    {DAYS[di]}
                  </p>
                  <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-primary' : 'text-text-card'}`}>
                    {format(date, 'd')}
                  </p>
                  {dayMinutes > 0 && (
                    <p className="text-xs text-text-muted">{Math.round(dayMinutes / 60)}h {dayMinutes % 60}m</p>
                  )}
                </div>

                {/* Items */}
                <div className="p-2 space-y-1.5 min-h-32">
                  {items.map((item, ii) => {
                    const color = SUBJECT_COLORS[item.subject] || '#6366F1';
                    return (
                      <div
                        key={ii}
                        className="group relative p-2 rounded-lg text-xs"
                        style={{ background: item.completed ? '#0f2e1f' : `${color}18`, borderLeft: `2px solid ${color}` }}
                      >
                        <button
                          onClick={() => handleToggleItem(day.date, ii)}
                          className={`flex items-center gap-1 w-full text-left ${item.completed ? 'line-through text-text-muted' : 'text-text-card'}`}
                        >
                          {item.completed ? <Check size={10} className="text-green-400 flex-shrink-0" /> : <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />}
                          <span className="truncate">{item.chapterName}</span>
                        </button>
                        {item.itemName && (
                          <p className="text-text-muted truncate mt-0.5 pl-3">{item.itemName}</p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-text-muted">{item.estimatedMinutes}m</span>
                          <button
                            onClick={() => handleRemoveItem(day.date, ii)}
                            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add button */}
                <div className="p-2 pt-0">
                  <button
                    onClick={() => setAddModal(day.date)}
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-card hover:bg-accent transition-colors border border-dashed"
                    style={{ borderColor: '#262C36' }}
                  >
                    <Plus size={12} />
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {addModal && (
        <AddItemModal
          date={addModal}
          onClose={() => setAddModal(null)}
          onAdd={handleAddItem}
        />
      )}
    </div>
  );
}
