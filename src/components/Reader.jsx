import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, List, Bookmark, Highlighter, Palette, Play, Pause, Keyboard } from 'lucide-react';
import { AutoScrollWidget } from './AutoScrollWidget';

export function Reader({
  book,
  initialChapterIndex = 0,
  settings,
  onBackToShelf,
  onOpenThemeSelector,
  onOpenBookmarksDrawer,
  onSaveProgress,
  onAddBookmark,
  onAddHighlight,
  bookmarks = [],
  highlights = []
}) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(initialChapterIndex);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(settings.autoScrollSpeed || 1.0);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Text Selection Highlight Popover state
  const [selectionMenu, setSelectionMenu] = useState(null);

  const readerContainerRef = useRef(null);

  const currentChapter = book?.chapters?.[currentChapterIndex] || {
    title: 'Chapter 1',
    content: '<p>No content available for this chapter.</p>'
  };

  useEffect(() => {
    setCurrentChapterIndex(initialChapterIndex);
  }, [initialChapterIndex]);

  // Global Keyboard Shortcuts for Navigation, Scrolling, and Auto-scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toUpperCase() : '';
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }

      const container = readerContainerRef.current;

      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          setIsAutoScrolling(prev => !prev);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (container) {
            container.scrollTop += 90;
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (container) {
            container.scrollTop -= 90;
          }
          break;
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          if (currentChapterIndex < (book.chapters?.length || 1) - 1) {
            goToChapter(currentChapterIndex + 1);
          }
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          if (currentChapterIndex > 0) {
            goToChapter(currentChapterIndex - 1);
          }
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          handleQuickBookmark();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          setIsTocOpen(prev => !prev);
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          onOpenBookmarksDrawer();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          onOpenThemeSelector();
          break;
        case '?':
          e.preventDefault();
          setShowShortcutsHelp(prev => !prev);
          break;
        case 'Escape':
          setIsTocOpen(false);
          setShowShortcutsHelp(false);
          setSelectionMenu(null);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChapterIndex, book.chapters, onOpenBookmarksDrawer, onOpenThemeSelector]);

  const handleScroll = () => {
    if (!readerContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = readerContainerRef.current;
    const totalScrollable = scrollHeight - clientHeight;
    const percent = totalScrollable > 0 ? (scrollTop / totalScrollable) * 100 : 0;
    setScrollPercent(percent);

    const totalProgress = ((currentChapterIndex + (percent / 100)) / (book.chapters?.length || 1)) * 100;
    onSaveProgress(book.id, {
      chapterIndex: currentChapterIndex,
      scrollPercent: percent,
      totalProgress
    });
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelectionMenu(null);
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionMenu({
        x: rect.left + rect.width / 2,
        y: rect.top,
        text: selectedText
      });
    }
  };

  const handleCreateHighlight = (colorName) => {
    if (!selectionMenu) return;
    onAddHighlight(book.id, {
      id: 'hl_' + Date.now(),
      chapterIndex: currentChapterIndex,
      chapterTitle: currentChapter.title,
      color: colorName,
      text: selectionMenu.text,
      timestamp: Date.now()
    });
    setSelectionMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleQuickBookmark = () => {
    onAddBookmark(book.id, {
      id: 'bm_' + Date.now(),
      chapterIndex: currentChapterIndex,
      chapterTitle: currentChapter.title,
      timestamp: Date.now()
    });
  };

  const goToChapter = (idx) => {
    if (idx >= 0 && idx < (book.chapters?.length || 0)) {
      setCurrentChapterIndex(idx);
      setIsTocOpen(false);
      if (readerContainerRef.current) {
        readerContainerRef.current.scrollTop = 0;
      }
    }
  };

  const getFontFamilyStyle = () => {
    switch (settings.fontFamily) {
      case 'sans': return "var(--font-sans)";
      case 'display': return "var(--font-display)";
      case 'mono': return "var(--font-mono)";
      case 'serif': default: return "var(--font-serif)";
    }
  };

  const isCurrentChapterBookmarked = bookmarks.some(b => b.chapterIndex === currentChapterIndex);

  return (
    <div className="reader-container">
      {/* Reader Sticky Header Toolbar */}
      <div className="reader-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-ghost" onClick={onBackToShelf}>
            <ArrowLeft size={18} /> Library
          </button>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, opacity: 0.8 }} className="desktop-only">
            {book.title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setIsTocOpen(!isTocOpen)}
            title="Table of Contents (Shortcut: T)"
          >
            <List size={19} />
          </button>

          <button
            className={`btn btn-ghost btn-icon ${isCurrentChapterBookmarked ? 'btn-primary' : ''}`}
            onClick={handleQuickBookmark}
            title={isCurrentChapterBookmarked ? "Chapter Bookmarked (Shortcut: B)" : "Add Bookmark (Shortcut: B)"}
          >
            <Bookmark size={19} fill={isCurrentChapterBookmarked ? "currentColor" : "none"} />
          </button>

          <button
            className="btn btn-ghost btn-icon"
            onClick={onOpenBookmarksDrawer}
            title="Bookmarks & Highlights (Shortcut: H)"
          >
            <Highlighter size={19} />
          </button>

          <button
            className="btn btn-ghost btn-icon"
            onClick={onOpenThemeSelector}
            title="Theme Customizer (Shortcut: M)"
          >
            <Palette size={19} />
          </button>

          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
            title="Keyboard Shortcuts (Shortcut: ?)"
          >
            <Keyboard size={19} />
          </button>
        </div>
      </div>

      {/* Main Chapter Reader Content Frame */}
      <div
        ref={readerContainerRef}
        onScroll={handleScroll}
        onMouseUp={handleTextSelection}
        tabIndex={0}
        style={{
          flex: 1,
          overflowY: 'auto',
          outline: 'none'
        }}
      >
        <div
          className="reader-content-frame"
          style={{
            fontFamily: getFontFamilyStyle(),
            fontSize: `${settings.fontSize || 18}px`,
            lineHeight: settings.lineHeight || 1.8
          }}
          dangerouslySetInnerHTML={{ __html: currentChapter.content }}
        />

        {/* Bottom Chapter Navigation Bar */}
        <div style={{
          maxWidth: 850, margin: '0 auto', padding: '2rem', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--bg-glass-border)'
        }}>
          <button
            className="btn btn-secondary"
            disabled={currentChapterIndex === 0}
            onClick={() => goToChapter(currentChapterIndex - 1)}
            title="Shortcut: Left Arrow"
          >
            <ChevronLeft size={18} /> Previous Chapter
          </button>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Chapter {currentChapterIndex + 1} of {book.chapters?.length || 1}
          </span>

          <button
            className="btn btn-primary"
            disabled={currentChapterIndex >= (book.chapters?.length || 1) - 1}
            onClick={() => goToChapter(currentChapterIndex + 1)}
            title="Shortcut: Right Arrow"
          >
            Next Chapter <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Text Selection Highlight Popover Menu */}
      {selectionMenu && (
        <div
          className="highlight-menu"
          style={{ left: `${selectionMenu.x}px`, top: `${selectionMenu.y}px` }}
        >
          <div
            className="color-dot color-lavender"
            title="Highlight Lavender"
            onClick={() => handleCreateHighlight('lavender')}
          />
          <div
            className="color-dot color-yellow"
            title="Highlight Yellow"
            onClick={() => handleCreateHighlight('yellow')}
          />
          <div
            className="color-dot color-pink"
            title="Highlight Pink"
            onClick={() => handleCreateHighlight('pink')}
          />
          <div
            className="color-dot color-mint"
            title="Highlight Mint"
            onClick={() => handleCreateHighlight('mint')}
          />
        </div>
      )}

      {/* Floating Auto-Scroll Control Widget */}
      <AutoScrollWidget
        containerRef={readerContainerRef}
        isPlaying={isAutoScrolling}
        onTogglePlay={() => setIsAutoScrolling(prev => !prev)}
        speed={scrollSpeed}
        onChangeSpeed={setScrollSpeed}
      />

      {/* TOC Side Drawer */}
      {isTocOpen && (
        <div className="side-drawer" style={{ left: 0, right: 'auto' }}>
          <div className="drawer-header">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Table of Contents</h3>
            <button className="btn btn-ghost btn-icon" onClick={() => setIsTocOpen(false)}>
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="drawer-content">
            {book.toc?.map((item, i) => (
              <div
                key={i}
                className={`toc-item ${currentChapterIndex === item.index ? 'active' : ''}`}
                onClick={() => goToChapter(item.index)}
              >
                {item.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutsHelp && (
        <div className="modal-overlay" onClick={() => setShowShortcutsHelp(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div className="brand-container">
                <div className="brand-icon">
                  <Keyboard size={20} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Keyboard Shortcuts</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowShortcutsHelp(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="shortcut-row">
                  <span className="shortcut-key">↑ / ↓ or Mouse Wheel</span>
                  <span className="shortcut-desc">Scroll Chapter Up / Down</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">Spacebar</span>
                  <span className="shortcut-desc">Play / Pause Auto-Scroll</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">→ or PageDown</span>
                  <span className="shortcut-desc">Next Chapter</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">← or PageUp</span>
                  <span className="shortcut-desc">Previous Chapter</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">B</span>
                  <span className="shortcut-desc">Bookmark Current Chapter</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">T</span>
                  <span className="shortcut-desc">Toggle Table of Contents</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">H</span>
                  <span className="shortcut-desc">View Bookmarks & Highlights</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">M</span>
                  <span className="shortcut-desc">Open Theme & Font Customizer</span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-key">Esc</span>
                  <span className="shortcut-desc">Close Drawers & Modals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
