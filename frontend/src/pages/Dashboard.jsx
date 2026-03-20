import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Calendar, Upload } from 'lucide-react';
import { useApp } from '../contexts/AppContext.jsx';
import CountdownTimer from '../components/dashboard/CountdownTimer.jsx';
import HeatMap from '../components/dashboard/HeatMap.jsx';
import RecentActivity from '../components/dashboard/RecentActivity.jsx';
import SubjectProgressCard from '../components/dashboard/SubjectProgressCard.jsx';
import { getHeatmap, getRecentActivity } from '../lib/api.js';

const QUOTES = [
  "Success is the sum of small efforts, repeated day in and day out.",
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction."
];

export default function Dashboard() {
  const { settings, subjects, loading } = useApp();
  const navigate = useNavigate();
  const [heatmap, setHeatmap] = useState([]);
  const [recent, setRecent] = useState([]);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    getHeatmap().then(setHeatmap).catch(console.warn);
    getRecentActivity().then(setRecent).catch(console.warn);
  }, []);

  const bannerStyle = settings.bannerImage
    ? { backgroundImage: `url(${settings.bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #1a1c3e 0%, #2d1b4e 50%, #1a3a4a 100%)' };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Profile + Banner — social media style */}
      <div className="rounded-2xl overflow-visible" style={{ position: 'relative' }}>
        {/* Banner */}
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{ ...bannerStyle, height: 180 }}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
          {/* Countdown top-right inside banner */}
          <div className="absolute top-4 right-4 bg-black/30 rounded-xl p-3 backdrop-blur-sm border border-white/10">
            <CountdownTimer examDate={settings.jeeExamDate} />
          </div>
        </div>

        {/* Profile pic overlapping banner at bottom-left */}
        <div className="absolute" style={{ bottom: -32, left: 24 }}>
          {settings.profilePicture ? (
            <img
              src={settings.profilePicture}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-4 shadow-xl"
              style={{ borderColor: '#0B0C10' }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 shadow-xl"
              style={{ background: '#6366F1', borderColor: '#0B0C10' }}
            >
              {(settings.userName || 'J')[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Name + quote — below banner, offset for profile pic */}
      <div className="pt-10 pl-2">
        <h1 className="text-xl font-bold text-text-card">
          {settings.userName || 'JEE Aspirant'}
        </h1>
        <p className="text-text-muted text-sm italic mt-1">"{quote}"</p>
      </div>

      {/* Subject Cards */}
      <div>
        <h2 className="text-lg font-bold text-text-card mb-4">Subjects</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl h-36 animate-pulse" style={{ background: '#161B22' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {subjects.map(subject => (
              <SubjectProgressCard key={subject.name} subject={subject} />
            ))}
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Heatmap */}
        <div className="lg:col-span-3 rounded-xl p-5 border" style={{ background: '#161B22', borderColor: '#262C36' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-text-card">Study Activity</h2>
            <span className="text-xs text-text-muted">Last 12 weeks</span>
          </div>
          <HeatMap data={heatmap} />
        </div>

        {/* Quick Actions + Progress */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl p-5 border" style={{ background: '#161B22', borderColor: '#262C36' }}>
            <h2 className="text-base font-bold text-text-card mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/analytics')}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors hover:bg-accent text-text-secondary"
                style={{ background: '#1E293B' }}
              >
                <BarChart2 size={16} className="text-primary" />
                View Analytics
              </button>
              <button
                onClick={() => navigate('/weekly-plan')}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors hover:bg-accent text-text-secondary"
                style={{ background: '#1E293B' }}
              >
                <Calendar size={16} className="text-green-400" />
                Weekly Plan
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors hover:bg-accent text-text-secondary"
                style={{ background: '#1E293B' }}
              >
                <Upload size={16} className="text-amber-400" />
                Upload Profile / Banner
              </button>
            </div>
          </div>

          <div className="rounded-xl p-5 border" style={{ background: '#161B22', borderColor: '#262C36' }}>
            <h2 className="text-base font-bold text-text-card mb-3">Overall Progress</h2>
            {subjects.length > 0 ? (
              <div className="space-y-3">
                {subjects.map(s => {
                  const colors = { Maths: '#6366F1', Physics: '#10B981', Chemistry: '#F59E0B' };
                  const color = colors[s.name] || '#6366F1';
                  return (
                    <div key={s.name}>
                      <div className="flex justify-between text-xs text-text-muted mb-1">
                        <span>{s.name}</span>
                        <span>{s.completedLectures}/{s.lectureCount} lectures</span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: '#262C36' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${s.progress}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl p-5 border" style={{ background: '#161B22', borderColor: '#262C36' }}>
        <h2 className="text-base font-bold text-text-card mb-4">Recent Activity</h2>
        <RecentActivity items={recent} />
      </div>
    </div>
  );
}
