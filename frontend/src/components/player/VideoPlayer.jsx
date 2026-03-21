import React, { useRef, useEffect, useState, useCallback } from 'react';
import YouTube from 'react-youtube';
import { X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, SkipForward, CheckCircle, Circle } from 'lucide-react';
import { updateProgress, recordAccess, toggleComplete } from '../../lib/api.js';
import VideoNotesPanel from './VideoNotesPanel.jsx';

function formatTime(seconds) {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function LocalVideoPlayer({ item, onClose, onComplete }) {
  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(item.currentTime || 0);
  const [duration, setDuration] = useState(item.duration || 0);
  const lastSaved = useRef(item.currentTime || 0);

  const videoUrl = `/api/files/video/${item.filePath}`;

  const saveProgress = useCallback(async (time, dur) => {
    if (Math.abs(time - lastSaved.current) < 2) return;
    lastSaved.current = time;
    try {
      await updateProgress(item._id, {
        currentTime: Math.floor(time),
        duration: isFinite(dur) ? Math.floor(dur) : undefined
      });
    } catch (err) {
      console.warn('Save progress error:', err.message);
    }
  }, [item._id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      if (item.currentTime > 0) video.currentTime = item.currentTime;
      setDuration(video.duration || item.duration || 0);
    };
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleEnded = () => {
      setPlaying(false);
      saveProgress(video.duration, video.duration);
      onComplete && onComplete();
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    progressInterval.current = setInterval(() => {
      if (video && !video.paused) saveProgress(video.currentTime, video.duration);
    }, 5000);

    recordAccess(item._id).catch(() => {});

    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      clearInterval(progressInterval.current);
      saveProgress(video.currentTime, video.duration);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); setPlaying(true); }
    else { video.pause(); setPlaying(false); }
  };

  const seek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    video.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const seekTo = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    video.play();
    setPlaying(true);
  };

  const getCurrentTime = () => videoRef.current?.currentTime ?? null;

  const skip = (s) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + s));
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Video */}
      <div className="relative flex-1 bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onClick={togglePlay}
          style={{ maxHeight: '100%' }}
        />
        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
          <div className="w-full h-1.5 rounded-full cursor-pointer mb-2" style={{ background: '#334155' }} onClick={seek}>
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: '#6366F1' }} />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => skip(-10)} className="text-white hover:text-primary"><RotateCcw size={15} /></button>
            <button onClick={togglePlay} className="text-white hover:text-primary">
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={() => skip(10)} className="text-white hover:text-primary"><SkipForward size={15} /></button>
            <span className="text-xs text-white">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <div className="flex-1" />
            <button onClick={() => { const v = videoRef.current; if (v) { v.muted = !muted; setMuted(!muted); } }} className="text-white hover:text-primary">
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <button onClick={() => videoRef.current?.requestFullscreen()} className="text-white hover:text-primary">
              <Maximize size={15} />
            </button>
          </div>
        </div>
      </div>
      {/* Notes panel injected from parent via render prop */}
      <div className="hidden" data-get-time="true" data-seek-to="true"
        data-current-time-fn={getCurrentTime} data-seek-fn={seekTo} />
      {/* Expose via window for parent to access */}
      {/* We'll handle via ref in parent */}
      <div ref={(el) => {
        if (el) {
          el.__getCurrentTime = getCurrentTime;
          el.__seekTo = seekTo;
        }
      }} style={{ display: 'none' }} id={`local-player-fns-${item._id}`} />
    </div>
  );
}

function YouTubePlayer({ item, onComplete, onReady: onReadyExternal }) {
  const playerRef = useRef(null);
  const progressInterval = useRef(null);
  const lastSaved = useRef(item.currentTime || 0);

  const saveProgress = useCallback(async (time, dur) => {
    if (Math.abs(time - lastSaved.current) < 2) return;
    lastSaved.current = time;
    try {
      await updateProgress(item._id, {
        currentTime: Math.floor(time),
        duration: dur ? Math.floor(dur) : undefined
      });
    } catch (err) {
      console.warn('Save progress error:', err.message);
    }
  }, [item._id]);

  const onReady = (e) => {
    playerRef.current = e.target;
    if (item.currentTime > 0) e.target.seekTo(item.currentTime);
    recordAccess(item._id).catch(() => {});

    progressInterval.current = setInterval(() => {
      const player = playerRef.current;
      if (player && player.getPlayerState() === 1) {
        saveProgress(player.getCurrentTime(), player.getDuration());
      }
    }, 5000);

    onReadyExternal && onReadyExternal(e.target);
  };

  const onStateChange = (e) => {
    if (e.data === 0) {
      const player = playerRef.current;
      if (player) saveProgress(player.getDuration(), player.getDuration());
      onComplete && onComplete();
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(progressInterval.current);
      if (playerRef.current) {
        try {
          saveProgress(playerRef.current.getCurrentTime(), playerRef.current.getDuration());
        } catch {}
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      <YouTube
        videoId={item.youtubeVideoId}
        onReady={onReady}
        onStateChange={onStateChange}
        opts={{
          width: '100%',
          height: '100%',
          playerVars: { autoplay: 1, start: Math.floor(item.currentTime || 0) }
        }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
}

function ManualItemPanel({ item, onClose, onComplete }) {
  const [completed, setCompleted] = useState(item.completed);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await toggleComplete(item._id, !completed);
      setCompleted(!completed);
      if (!completed) onComplete && onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl border flex flex-col" style={{ background: '#161B22', borderColor: '#262C36', height: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: '#262C36' }}>
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="text-sm font-medium text-text-card truncate">{item.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#262C36', color: '#94A3B8' }}>Manual</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${completed ? 'bg-green-900 text-green-400' : 'border text-text-muted hover:bg-accent'}`}
              style={!completed ? { borderColor: '#262C36' } : {}}
            >
              {completed ? <CheckCircle size={14} /> : <Circle size={14} />}
              {completed ? 'Completed' : 'Mark Done'}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-text-muted hover:text-text-card">
              <X size={16} />
            </button>
          </div>
        </div>
        {/* Notes panel takes full space */}
        <div className="flex-1 overflow-hidden">
          <VideoNotesPanel item={item} getCurrentTime={null} onSeek={null} />
        </div>
      </div>
    </div>
  );
}

export default function VideoPlayer({ item, onClose, onComplete }) {
  const ytPlayerRef = useRef(null);
  const localFnsRef = useRef(null);

  if (!item) return null;

  if (!item.hasVideo && item.itemType === 'manual') {
    return <ManualItemPanel item={item} onClose={onClose} onComplete={onComplete} />;
  }

  const isYouTube = item.itemType === 'youtube';

  const getCurrentTime = () => {
    if (isYouTube) {
      try { return ytPlayerRef.current?.getCurrentTime() ?? null; } catch { return null; }
    }
    // local video
    const el = document.getElementById(`local-player-fns-${item._id}`);
    return el?.__getCurrentTime?.() ?? null;
  };

  const seekTo = (seconds) => {
    if (isYouTube) {
      try { ytPlayerRef.current?.seekTo(seconds, true); ytPlayerRef.current?.playVideo(); } catch {}
    } else {
      const el = document.getElementById(`local-player-fns-${item._id}`);
      el?.__seekTo?.(seconds);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="w-full max-w-6xl rounded-xl overflow-hidden shadow-2xl border flex flex-col" style={{ background: '#161B22', borderColor: '#262C36', maxHeight: '92vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: '#262C36' }}>
          <h3 className="text-sm font-medium text-text-card truncate flex-1">{item.name}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-text-muted hover:text-text-card ml-2 flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {/* Video: 65% */}
          <div className="flex-shrink-0 overflow-hidden" style={{ width: '65%', background: '#000' }}>
            {isYouTube ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%', height: 0 }}>
                <div className="absolute inset-0">
                  <YouTubePlayer
                    item={item}
                    onComplete={onComplete}
                    onReady={(player) => { ytPlayerRef.current = player; }}
                  />
                </div>
              </div>
            ) : (
              <LocalVideoPlayer item={item} onClose={onClose} onComplete={onComplete} />
            )}
          </div>

          {/* Notes panel: 35% */}
          <div className="flex-1 overflow-hidden border-l" style={{ borderColor: '#262C36' }}>
            <VideoNotesPanel
              item={item}
              getCurrentTime={getCurrentTime}
              onSeek={seekTo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
