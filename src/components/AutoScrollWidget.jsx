import React, { useEffect, useRef } from 'react';
import { Play, Pause, Gauge } from 'lucide-react';

export function AutoScrollWidget({ containerRef, isPlaying, onTogglePlay, speed, onChangeSpeed }) {
  const animFrameId = useRef(null);

  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();

    const scrollStep = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const container = containerRef.current;
      const pxPerSec = 60 * speed;

      if (container && container.scrollHeight > container.clientHeight) {
        container.scrollTop += pxPerSec * delta;
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollTop + clientHeight >= scrollHeight - 2) {
          onTogglePlay();
          return;
        }
      } else {
        window.scrollBy(0, pxPerSec * delta);
        const { scrollY, innerHeight } = window;
        const docHeight = document.documentElement.scrollHeight;
        if (scrollY + innerHeight >= docHeight - 2) {
          onTogglePlay();
          return;
        }
      }

      animFrameId.current = requestAnimationFrame(scrollStep);
    };

    animFrameId.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isPlaying, speed, containerRef, onTogglePlay]);

  return (
    <div className="autoscroll-floating-widget">
      <button
        className="btn btn-primary btn-icon"
        style={{ width: 34, height: 34 }}
        onClick={onTogglePlay}
        title={isPlaying ? "Pause Auto-Scroll (Spacebar)" : "Start Auto-Scroll (Spacebar)"}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Gauge size={15} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.78rem', fontWeight: 700, minWidth: 32, color: 'var(--text-primary)' }}>
          {speed.toFixed(1)}x
        </span>
        <input
          type="range"
          min="0.5"
          max="4.0"
          step="0.1"
          value={speed}
          onChange={e => onChangeSpeed(parseFloat(e.target.value))}
          className="speed-slider"
          title="Auto-scroll speed"
        />
      </div>
    </div>
  );
}
