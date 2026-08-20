import React, { useState, useRef } from 'react';
import { Search, Plus, FolderSearch, Trash2, Library, Sparkles, ArrowLeft, ArrowRight, ArrowUpDown, GripHorizontal } from 'lucide-react';
import { parseEpub } from '../services/epubParser';
import { saveBook, deleteBook, clearAllBooks, saveBookOrder } from '../services/db';
import { createSampleEpub } from '../services/sampleEpub';

export function LibraryShelf({ books = [], onOpenBook, onRefreshBooks, onOpenScanModal }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('custom'); // 'custom', 'title', 'author', 'recent'
  const [draggedIndex, setDraggedIndex] = useState(null);
  const fileInputRef = useRef(null);

  // Apply sorting
  const getSortedBooks = () => {
    let list = [...books];

    if (searchQuery.trim()) {
      list = list.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'author') {
      list.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
    } else if (sortBy === 'recent') {
      list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    }

    return list;
  };

  const displayedBooks = getSortedBooks();

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      if (file.name.toLowerCase().endsWith('.epub')) {
        try {
          const parsed = await parseEpub(file, file.name);
          await saveBook(parsed);
        } catch (err) {
          console.error('Error importing book:', err);
          alert(`Could not parse ${file.name}: ${err.message}`);
        }
      }
    }
    onRefreshBooks();
  };

  const handleDeleteBook = async (e, bookId, bookTitle) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to remove "${bookTitle}" from your library shelf?`)) {
      await deleteBook(bookId);
      onRefreshBooks();
    }
  };

  const handleAddSampleBooks = async () => {
    const sample = createSampleEpub();
    await saveBook(sample);
    onRefreshBooks();
  };

  const handleClearLibrary = async () => {
    if (confirm('Are you sure you want to delete all books from your library?')) {
      await clearAllBooks();
      onRefreshBooks();
    }
  };

  // Reorder Handler (Move item from fromIdx to toIdx)
  const handleMoveBook = async (e, fromIdx, toIdx) => {
    e.stopPropagation();
    if (toIdx < 0 || toIdx >= displayedBooks.length) return;

    const newOrderBooks = [...displayedBooks];
    const [movedBook] = newOrderBooks.splice(fromIdx, 1);
    newOrderBooks.splice(toIdx, 0, movedBook);

    setSortBy('custom');
    const newIdOrder = newOrderBooks.map(b => b.id);
    await saveBookOrder(newIdOrder);
    onRefreshBooks();
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newOrderBooks = [...displayedBooks];
    const [movedBook] = newOrderBooks.splice(draggedIndex, 1);
    newOrderBooks.splice(dropIndex, 0, movedBook);

    setDraggedIndex(null);
    setSortBy('custom');
    const newIdOrder = newOrderBooks.map(b => b.id);
    await saveBookOrder(newIdOrder);
    onRefreshBooks();
  };

  // Group books into visual shelf rows (5 books per shelf)
  const chunkSize = 5;
  const shelfRows = [];
  for (let i = 0; i < displayedBooks.length; i += chunkSize) {
    shelfRows.push({
      rowIndex: i / chunkSize,
      books: displayedBooks.slice(i, i + chunkSize),
      startIndex: i
    });
  }

  return (
    <div className="shelf-container">
      {/* Action Header & Search Controls */}
      <div className="shelf-controls">
        <div className="search-bar-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-glass-border)' }}>
            <ArrowUpDown size={15} style={{ color: 'var(--accent-purple)' }} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
            >
              <option value="custom">Custom Order (Drag / Rearrange)</option>
              <option value="title">Sort by Title (A-Z)</option>
              <option value="author">Sort by Author</option>
              <option value="recent">Sort by Recently Added</option>
            </select>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept=".epub"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            <Plus size={18} /> Add EPUB
          </button>

          <button className="btn btn-secondary" onClick={onOpenScanModal}>
            <FolderSearch size={18} /> Scan Folder
          </button>

          <button className="btn btn-ghost" onClick={handleAddSampleBooks} title="Add classic sample book">
            <Sparkles size={18} /> Add Sample Book
          </button>

          {books.length > 0 && (
            <button className="btn btn-danger btn-icon" onClick={handleClearLibrary} title="Clear Library">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Bookshelf Display */}
      {displayedBooks.length === 0 ? (
        <div className="empty-shelf">
          <Library className="empty-icon" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {searchQuery ? 'No matching books found' : 'Your Library Shelf is Empty'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: 460, margin: '0 auto 1.5rem auto' }}>
            {searchQuery
              ? `No books found for "${searchQuery}". Try a different keyword or clear search.`
              : 'Add your favorite .epub files or scan a folder directory containing your e-book collection.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
              <Plus size={18} /> Upload EPUB File
            </button>
            <button className="btn btn-secondary" onClick={onOpenScanModal}>
              <FolderSearch size={18} /> Moon+ Reader Scan
            </button>
            <button className="btn btn-ghost" onClick={handleAddSampleBooks}>
              <Sparkles size={18} /> Add Sample Classic
            </button>
          </div>
        </div>
      ) : (
        shelfRows.map((row) => (
          <div className="shelf-row" key={`shelf-row-${row.rowIndex}`}>
            <div className="books-grid">
              {row.books.map((book, itemInRowIdx) => {
                const globalIndex = row.startIndex + itemInRowIdx;

                return (
                  <div
                    className="book-card"
                    key={book.id}
                    draggable
                    onDragStart={e => handleDragStart(e, globalIndex)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, globalIndex)}
                    onClick={() => onOpenBook(book.id)}
                    title="Click to Read • Drag or use arrows to rearrange order"
                  >
                    <button
                      className="book-delete-btn"
                      title="Remove book from shelf"
                      onClick={e => handleDeleteBook(e, book.id, book.title)}
                    >
                      <Trash2 size={14} />
                    </button>

                    {/* Move Left / Right Shortcut Buttons */}
                    <div className="reorder-controls">
                      {globalIndex > 0 && (
                        <button
                          className="reorder-btn"
                          title="Move Left (Reorder)"
                          onClick={e => handleMoveBook(e, globalIndex, globalIndex - 1)}
                        >
                          <ArrowLeft size={13} />
                        </button>
                      )}
                      <GripHorizontal size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                      {globalIndex < displayedBooks.length - 1 && (
                        <button
                          className="reorder-btn"
                          title="Move Right (Reorder)"
                          onClick={e => handleMoveBook(e, globalIndex, globalIndex + 1)}
                        >
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>

                    {book.progressPercent > 0 && (
                      <div className="progress-badge">
                        {Math.round(book.progressPercent)}%
                      </div>
                    )}

                    <div className="cover-wrapper">
                      <div className="cover-spine" />
                      {book.coverDataUrl ? (
                        <img src={book.coverDataUrl} alt={book.title} className="cover-img" />
                      ) : (
                        <>
                          <div className="book-title-fallback">{book.title}</div>
                          <div className="book-author-fallback">{book.author || 'EPUB Book'}</div>
                        </>
                      )}
                    </div>

                    <div className="book-meta">
                      <div className="book-meta-title" title={book.title}>{book.title}</div>
                      <div className="book-meta-author" title={book.author}>{book.author || 'Unknown Author'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="shelf-plank" />
          </div>
        ))
      )}
    </div>
  );
}
