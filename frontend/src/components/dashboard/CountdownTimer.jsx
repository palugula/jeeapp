import React, { useState, useEffect } from 'react';

function FlipUnit({ value, label }) {
  const formatted = String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold text-white shadow-lg"
          style={{ background: '#6366F1', fontVariantNumeric: 'tabular-nums' }}
        >
          {formatted}
        </div>
      </div>
      <span className="text-xs text-text-muted mt-1.5 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function CountdownTimer({ examDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!examDate) return;

    const target = new Date(examDate).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [examDate]);

  if (!examDate) {
    return (
      <div className="text-center py-4">
        <p className="text-text-muted text-sm">Set your JEE exam date in Settings</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-text-muted text-sm font-medium">Time until JEE</p>
      <div className="flex items-end gap-3">
        <FlipUnit value={timeLeft.days} label="Days" />
        <span className="text-2xl font-bold text-primary mb-4">:</span>
        <FlipUnit value={timeLeft.hours} label="Hours" />
        <span className="text-2xl font-bold text-primary mb-4">:</span>
        <FlipUnit value={timeLeft.minutes} label="Mins" />
        <span className="text-2xl font-bold text-primary mb-4">:</span>
        <FlipUnit value={timeLeft.seconds} label="Secs" />
      </div>
    </div>
  );
}
