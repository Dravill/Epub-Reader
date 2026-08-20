import React, { useState, useEffect } from 'react';
import { BookOpen, Palette, FolderSearch, Moon, Sun } from 'lucide-react';
import { getBooksMetadata, getBook, getSettings, saveSettings, saveReadingProgress, getReadingProgress, getBookmarks, addBookmark, deleteBookmark, getHighlights, addHighlight, deleteHighlight } from './services/db';
import { LibraryShelf } from './components/LibraryShelf';
import { Reader } from './components/Reader';
import { ThemeSelector } from './components/ThemeSelector';
import { BookmarksDrawer } from './components/BookmarksDrawer';
import { FolderScanModal } from './components/FolderScanModal';

export function App() {
  const [view, setView] = useState('shelf'); // 'shelf' or 'reader'
  const [books, setBooks] = useState([]);
  const [activeBook, setActiveBook] = useState(null);
  const [activeProgress, setActiveProgress] = useState({ chapterIndex: 0, scrollPercent: 0 });

  // Customization Settings
  const [settings, setSettings] = useState({
    theme: 'lavender',
    fontSize: 18,
    fontFamily: 'serif',
    lineHeight: 1.8,
    autoScrollSpeed: 1.0
  });

  // Bookmarks & Highlights for Active Book
  const [bookmarks, setBookmarks] = useState([]);
  const [highlights, setHighlights] = useState([]);

  // Modals & Drawers
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isBookmarksDrawerOpen, setIsBookmarksDrawerOpen] = useState(false);

  useEffect(() => {
    loadSettings();
    loadBooks();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'lavender');
  }, [settings.theme]);

  const loadSettings = async () => {
    const saved = await getSettings();
    setSettings(saved);
  };

  const updateSettings = async (newSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  // Load lightweight books metadata for shelf view
  const loadBooks = async () => {
    const loadedBooks = await getBooksMetadata();
    const booksWithProgress = await Promise.all(
      loadedBooks.map(async (b) => {
        const prog = await getReadingProgress(b.id);
        return {
          ...b,
          progressPercent: prog.totalProgress || 0
        };
      })
    );
    setBooks(booksWithProgress);
  };

  const handleOpenBook = async (bookId) => {
    const book = await getBook(bookId);
    if (!book) return;

    const progress = await getReadingProgress(bookId);
    const bMarks = await getBookmarks(bookId);
    const hLights = await getHighlights(bookId);

    setActiveBook(book);
    setActiveProgress(progress);
    setBookmarks(bMarks);
    setHighlights(hLights);
    setView('reader');
  };

  const handleBackToShelf = () => {
    setActiveBook(null); // Garbage collect full book from memory
    loadBooks();
    setView('shelf');
  };

  const handleSaveProgress = async (bookId, progressData) => {
    await saveReadingProgress(bookId, progressData);
  };

  const handleAddBookmark = async (bookId, bookmarkData) => {
    const updated = await addBookmark(bookId, bookmarkData);
    setBookmarks(updated);
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    if (!activeBook) return;
    const updated = await deleteBookmark(activeBook.id, bookmarkId);
    setBookmarks(updated);
  };

  const handleAddHighlight = async (bookId, highlightData) => {
    const updated = await addHighlight(bookId, highlightData);
    setHighlights(updated);
  };

  const handleDeleteHighlight = async (highlightId) => {
    if (!activeBook) return;
    const updated = await deleteHighlight(activeBook.id, highlightId);
    setHighlights(updated);
  };

  const toggleQuickTheme = () => {
    const nextTheme = settings.theme === 'dark-lavender' ? 'lavender' : 'dark-lavender';
    updateSettings({ ...settings, theme: nextTheme });
  };

  return (
    <div className="app-root">
      {/* Top Application Header */}
      <header className="app-header">
        <div className="brand-container" onClick={handleBackToShelf} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">
            <BookOpen size={22} />
          </div>
          <div>
            <span className="brand-title">Aetheria</span>
            <span className="brand-badge" style={{ marginLeft: '0.5rem' }}>EPUB Reader</span>
          </div>
        </div>

        <div className="nav-actions">
          <button
            className="btn btn-ghost btn-icon"
            onClick={toggleQuickTheme}
            title={settings.theme.includes('dark') ? "Switch to Lavender Dreams" : "Switch to Midnight Violet"}
          >
            {settings.theme.includes('dark') ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setIsThemeModalOpen(true)}
            title="Theme & Font Settings"
          >
            <Palette size={19} />
          </button>

          {view === 'shelf' && (
            <button className="btn btn-secondary" onClick={() => setIsScanModalOpen(true)}>
              <FolderSearch size={17} /> Scan Folder
            </button>
          )}
        </div>
      </header>

      {/* Main View Router */}
      <main>
        {view === 'shelf' ? (
          <LibraryShelf
            books={books}
            onOpenBook={handleOpenBook}
            onRefreshBooks={loadBooks}
            onOpenScanModal={() => setIsScanModalOpen(true)}
          />
        ) : (
          activeBook && (
            <Reader
              book={activeBook}
              initialChapterIndex={activeProgress.chapterIndex || 0}
              settings={settings}
              onBackToShelf={handleBackToShelf}
              onOpenThemeSelector={() => setIsThemeModalOpen(true)}
              onOpenBookmarksDrawer={() => setIsBookmarksDrawerOpen(true)}
              onSaveProgress={handleSaveProgress}
              onAddBookmark={handleAddBookmark}
              onAddHighlight={handleAddHighlight}
              bookmarks={bookmarks}
              highlights={highlights}
            />
          )
        )}
      </main>

      {/* Custom Theme & Typography Modal */}
      <ThemeSelector
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

      {/* Moon+ Reader Style Directory Scanner Modal */}
      <FolderScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScanComplete={loadBooks}
        existingBooks={books}
      />

      {/* Bookmarks & Highlights Side Drawer */}
      <BookmarksDrawer
        isOpen={isBookmarksDrawerOpen}
        onClose={() => setIsBookmarksDrawerOpen(false)}
        bookmarks={bookmarks}
        highlights={highlights}
        onJumpToLocation={(chapterIndex) => {}}
        onDeleteBookmark={handleDeleteBookmark}
        onDeleteHighlight={handleDeleteHighlight}
      />
    </div>
  );
}
