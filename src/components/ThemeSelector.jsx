import React from 'react';
import { Palette, Type, Sliders, X, Check } from 'lucide-react';

export function ThemeSelector({ isOpen, onClose, settings, onUpdateSettings }) {
  if (!isOpen) return null;

  const themes = [
    { id: 'lavender', name: 'Lavender Dreams', bg: '#F7F3FB', accent: '#8E24AA', border: '#AB47BC' },
    { id: 'dark-lavender', name: 'Midnight Violet', bg: '#120C1F', accent: '#BA68C8', border: '#CE93D8' },
    { id: 'sepia', name: 'Cozy Sepia', bg: '#F5EFEB', accent: '#8C533E', border: '#B57D67' },
    { id: 'light', name: 'Minimal Light', bg: '#FAFAFD', accent: '#7C4DFF', border: '#9E77FF' },
    { id: 'oled', name: 'OLED Dark', bg: '#000000', accent: '#B388FF', border: '#D1B3FF' }
  ];

  const fonts = [
    { id: 'serif', name: 'Merriweather (Serif)', family: "'Merriweather', 'Georgia', serif" },
    { id: 'sans', name: 'Plus Jakarta (Sans)', family: "'Plus Jakarta Sans', system-ui, sans-serif" },
    { id: 'display', name: 'Playfair (Display)', family: "'Playfair Display', Georgia, serif" },
    { id: 'mono', name: 'Fira Code (Monospace)', family: "'Fira Code', monospace" }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="brand-container">
            <div className="brand-icon">
              <Palette size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Reader Customization</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Themes Section */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
              Color Theme
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {themes.map(t => (
                <div
                  key={t.id}
                  onClick={() => onUpdateSettings({ ...settings, theme: t.id })}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: t.bg,
                    border: `2px solid ${settings.theme === t.id ? t.border : 'rgba(0,0,0,0.1)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: settings.theme === t.id ? 'var(--shadow-glow)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: t.id.includes('dark') || t.id === 'oled' ? '#FFF' : '#222' }}>
                    {t.name}
                  </span>
                  {settings.theme === t.id && <Check size={16} style={{ color: t.accent }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Font Family Section */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
              Typography Font
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {fonts.map(f => (
                <div
                  key={f.id}
                  onClick={() => onUpdateSettings({ ...settings, fontFamily: f.id })}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: settings.fontFamily === f.id ? 'var(--accent-light)' : 'var(--bg-secondary)',
                    color: settings.fontFamily === f.id ? 'var(--accent-purple)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontFamily: f.family,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: settings.fontFamily === f.id ? 700 : 400
                  }}
                >
                  <span>{f.name}</span>
                  {settings.fontFamily === f.id && <Check size={16} />}
                </div>
              ))}
            </div>
          </div>

          {/* Font Size Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Font Size ({settings.fontSize || 18}px)
              </label>
              <Type size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <input
              type="range"
              min="13"
              max="36"
              step="1"
              value={settings.fontSize || 18}
              onChange={e => onUpdateSettings({ ...settings, fontSize: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
            />
          </div>

          {/* Line Height Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Line Spacing ({settings.lineHeight || 1.8})
              </label>
              <Sliders size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <input
              type="range"
              min="1.2"
              max="2.6"
              step="0.1"
              value={settings.lineHeight || 1.8}
              onChange={e => onUpdateSettings({ ...settings, lineHeight: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
