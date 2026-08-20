import React, { useState } from 'react';
import { Bookmark, Highlighter, X, Trash2, ChevronRight, Clock } from 'lucide-react';

export function BookmarksDrawer({
  isOpen,
  onClose,
  bookmarks = [],
  highlights = [],
  onJumpToLocation,
  onDeleteBookmark,
  onDeleteHighlight
}) {
  const [activeTab, setActiveTab] = useState('bookmarks'); // 'bookmarks' or 'highlights'

  if (!isOpen) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="side-drawer">
      <div className="drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className={`btn btn-ghost ${activeTab === 'bookmarks' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
          >
            <Bookmark size={16} /> Bookmarks ({bookmarks.length})
          </button>
          <button
            className={`btn btn-ghost ${activeTab === 'highlights' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('highlights')}
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
          >
            <Highlighter size={16} /> Highlights ({highlights.length})
          </button>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="drawer-content">
        {activeTab === 'bookmarks' && (
          bookmarks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Bookmark size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem' }}>No bookmarks saved yet.</p>
              <p style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
                Click the bookmark icon while reading to save your position.
              </p>
            </div>
          ) : (
            bookmarks.map(b => (
              <div
                key={b.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  marginBottom: '0.65rem',
                  cursor: 'pointer',
                  border: '1px solid var(--bg-glass-border)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  onJumpToLocation(b.chapterIndex);
                  onClose();
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                    {b.chapterTitle || `Chapter ${b.chapterIndex + 1}`}
                  </span>
                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ width: 24, height: 24 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBookmark(b.id);
                    }}
                  >
                    <Trash2 size={14} style={{ color: '#EF4444' }} />
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={12} /> {formatDate(b.timestamp)}
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'highlights' && (
          highlights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Highlighter size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem' }}>No text highlights saved yet.</p>
              <p style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
                Select any text in a chapter to highlight it in lavender, yellow, pink or mint!
              </p>
            </div>
          ) : (
            highlights.map(h => (
              <div
                key={h.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  marginBottom: '0.65rem',
                  cursor: 'pointer',
                  borderLeft: `4px solid ${getColorHex(h.color)}`,
                  borderTop: '1px solid var(--bg-glass-border)',
                  borderRight: '1px solid var(--bg-glass-border)',
                  borderBottom: '1px solid var(--bg-glass-border)'
                }}
                onClick={() => {
                  onJumpToLocation(h.chapterIndex);
                  onClose();
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {h.chapterTitle || `Chapter ${h.chapterIndex + 1}`}
                  </span>
                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ width: 24, height: 24 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHighlight(h.id);
                    }}
                  >
                    <Trash2 size={14} style={{ color: '#EF4444' }} />
                  </button>
                </div>

                <p style={{
                  fontSize: '0.85rem',
                  fontStyle: 'italic',
                  color: 'var(--text-primary)',
                  marginBottom: '0.35rem',
                  lineHeight: 1.4
                }}>
                  “{h.text}”
                </p>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={12} /> {formatDate(h.timestamp)}
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

function getColorHex(colorName) {
  switch (colorName) {
    case 'lavender': return '#AB47BC';
    case 'yellow': return '#FBC02D';
    case 'pink': return '#EC407A';
    case 'mint': return '#66BB6A';
    default: return '#AB47BC';
  }
}
