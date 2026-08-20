import { get, set, del, keys } from 'idb-keyval';

// Key prefix constants
const PREFIX_BOOK = 'book_';
const PREFIX_PROGRESS = 'progress_';
const PREFIX_BOOKMARKS = 'bookmarks_';
const PREFIX_HIGHLIGHTS = 'highlights_';
const KEY_SETTINGS = 'app_settings';
const KEY_BOOK_ORDER = 'app_book_order';

/**
 * Save a book to IndexedDB
 */
export async function saveBook(bookData) {
  if (!bookData.id) throw new Error('Book must have a unique ID');
  const key = `${PREFIX_BOOK}${bookData.id}`;
  await set(key, bookData);

  // Append to book order if not present
  const currentOrder = (await get(KEY_BOOK_ORDER)) || [];
  if (!currentOrder.includes(bookData.id)) {
    await set(KEY_BOOK_ORDER, [...currentOrder, bookData.id]);
  }
  return bookData.id;
}

/**
 * Get a specific full book by ID (only loaded when reading)
 */
export async function getBook(bookId) {
  return await get(`${PREFIX_BOOK}${bookId}`);
}

/**
 * Delete a book and associated reading data from IndexedDB
 */
export async function deleteBook(bookId) {
  await del(`${PREFIX_BOOK}${bookId}`);
  await del(`${PREFIX_PROGRESS}${bookId}`);
  await del(`${PREFIX_BOOKMARKS}${bookId}`);
  await del(`${PREFIX_HIGHLIGHTS}${bookId}`);

  // Remove from book order
  const currentOrder = (await get(KEY_BOOK_ORDER)) || [];
  const updatedOrder = currentOrder.filter(id => id !== bookId);
  await set(KEY_BOOK_ORDER, updatedOrder);
}

/**
 * Get LIGHTWEIGHT books metadata for the Library Shelf
 * (Does NOT load chapter HTML or heavy text into memory)
 */
export async function getBooksMetadata() {
  const allKeys = await keys();
  const bookKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(PREFIX_BOOK));
  const bookMap = {};
  
  for (const k of bookKeys) {
    const book = await get(k);
    if (book) {
      // Extract only lightweight metadata for shelf rendering
      bookMap[book.id] = {
        id: book.id,
        title: book.title,
        author: book.author,
        coverDataUrl: book.coverDataUrl,
        totalChapters: book.chapters?.length || 0,
        addedAt: book.addedAt || 0
      };
    }
  }

  const savedOrder = (await get(KEY_BOOK_ORDER)) || [];
  const orderedBooks = [];

  for (const id of savedOrder) {
    if (bookMap[id]) {
      orderedBooks.push(bookMap[id]);
      delete bookMap[id];
    }
  }

  for (const id in bookMap) {
    orderedBooks.push(bookMap[id]);
  }

  return orderedBooks;
}

/**
 * Save custom book ID order list
 */
export async function saveBookOrder(orderedIds) {
  await set(KEY_BOOK_ORDER, orderedIds);
}

/**
 * Clear all books from the library
 */
export async function clearAllBooks() {
  const allKeys = await keys();
  for (const k of allKeys) {
    if (typeof k === 'string' && k.startsWith(PREFIX_BOOK)) {
      await del(k);
    }
  }
  await del(KEY_BOOK_ORDER);
}

/**
 * Reading progress management
 */
export async function saveReadingProgress(bookId, progressData) {
  const key = `${PREFIX_PROGRESS}${bookId}`;
  const existing = (await get(key)) || {};
  const updated = {
    ...existing,
    ...progressData,
    lastRead: Date.now()
  };
  await set(key, updated);
}

export async function getReadingProgress(bookId) {
  return (await get(`${PREFIX_PROGRESS}${bookId}`)) || { chapterIndex: 0, scrollPercent: 0 };
}

/**
 * Bookmarks management
 */
export async function getBookmarks(bookId) {
  return (await get(`${PREFIX_BOOKMARKS}${bookId}`)) || [];
}

export async function addBookmark(bookId, bookmark) {
  const bookmarks = await getBookmarks(bookId);
  const updated = [bookmark, ...bookmarks];
  await set(`${PREFIX_BOOKMARKS}${bookId}`, updated);
  return updated;
}

export async function deleteBookmark(bookId, bookmarkId) {
  const bookmarks = await getBookmarks(bookId);
  const updated = bookmarks.filter(b => b.id !== bookmarkId);
  await set(`${PREFIX_BOOKMARKS}${bookId}`, updated);
  return updated;
}

/**
 * Highlights management
 */
export async function getHighlights(bookId) {
  return (await get(`${PREFIX_HIGHLIGHTS}${bookId}`)) || [];
}

export async function addHighlight(bookId, highlight) {
  const highlights = await getHighlights(bookId);
  const updated = [highlight, ...highlights];
  await set(`${PREFIX_HIGHLIGHTS}${bookId}`, updated);
  return updated;
}

export async function deleteHighlight(bookId, highlightId) {
  const highlights = await getHighlights(bookId);
  const updated = highlights.filter(h => h.id !== highlightId);
  await set(`${PREFIX_HIGHLIGHTS}${bookId}`, updated);
  return updated;
}

/**
 * User Settings
 */
export async function getSettings() {
  return (await get(KEY_SETTINGS)) || {
    theme: 'lavender',
    fontSize: 18,
    fontFamily: 'serif',
    lineHeight: 1.8,
    autoScrollSpeed: 1.0
  };
}

export async function saveSettings(settings) {
  await set(KEY_SETTINGS, settings);
}
