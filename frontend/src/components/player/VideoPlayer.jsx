import React, { useRef, useEffect, useState, useCallback } from 'react';
import YouTube from 'react-youtube';
import { X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, SkipForward } from 'lucide-react';
import { updateProgress, recordAccess } from '../../lib/api.js';

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
  const [volume, setVolume] = useState(1);
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
      if (item.currentTime > 0) {
        video.currentTime = item.currentTime;
      }
      setDuration(video.duration || item.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setPlaying(false);
      saveProgress(video.duration, video.duration);
      onComplete && onComplete();
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    progressInterval.current = setInterval(() => {
      if (video && !video.paused) {
        saveProgress(video.currentTime, video.duration);
      }
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
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * duration;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  const skip = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const fullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) video.requestFullscreen();
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl border" style={{ background: '#000', borderColor: '#262C36' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2" style={{ background: '#161B22' }}>
          <h3 className="text-sm font-medium text-text-card truncate flex-1">{item.name}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-text-muted hover:text-text-card ml-2">
            <X size={16} />
          </button>
        </div>

        {/* Video */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full"
            style={{ maxHeight: '60vh' }}
            onClick={togglePlay}
          />

          {/* Controls */}
          <div
            className="absolute bottom-0 left-0 right-0 p-3"
            style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}
          >
            {/* Progress bar */}
            <div
              className="w-full h-2 rounded-full cursor-pointer mb-2"
              style={{ background: '#334155' }}
              onClick={seek}
            >
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: '#6366F1' }} />
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => skip(-10)} className="text-white hover:text-primary transition-colors">
                <RotateCcw size={16} />
              </button>
              <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                {playing ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button onClick={() => skip(10)} className="text-white hover:text-primary transition-colors">
                <SkipForward size={16} />
              </button>

              <span className="text-xs text-white">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex-1" />

              <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              <button onClick={fullscreen} className="text-white hover:text-primary transition-colors">
                <Maximize size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function YouTubePlayer({ item, onClose, onComplete }) {
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
    if (item.currentTime > 0) {
      e.target.seekTo(item.currentTime);
    }
    recordAccess(item._id).catch(() => {});

    progressInterval.current = setInterval(() => {
      const player = playerRef.current;
      if (player && player.getPlayerState() === 1) { // playing
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        saveProgress(currentTime, duration);
      }
    }, 5000);
  };

  const onStateChange = (e) => {
    if (e.data === 0) { // ended
      const player = playerRef.current;
      if (player) {
        saveProgress(player.getDuration(), player.getDuration());
      }
      onComplete && onComplete();
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(progressInterval.current);
      if (playerRef.current) {
        try {
          const time = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          saveProgress(time, dur);
        } catch {}
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="w-full max-w-4xl rounded-xl overflow-hidden shadow-2xl border" style={{ background: '#161B22', borderColor: '#262C36' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="text-sm font-medium text-text-card truncate flex-1">{item.name}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-text-muted hover:text-text-card ml-2">
            <X size={16} />
          </button>
        </div>

        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <YouTube
            videoId={item.youtubeVideoId}
            onReady={onReady}
            onStateChange={onStateChange}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: 1,
                start: Math.floor(item.currentTime || 0)
              }
            }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}

export default function VideoPlayer({ item, onClose, onComplete }) {
  if (!item) return null;

  if (item.itemType === 'youtube') {
    return <YouTubePlayer item={item} onClose={onClose} onComplete={onComplete} />;
  }

  return <LocalVideoPlayer item={item} onClose={onClose} onComplete={onComplete} />;
}
