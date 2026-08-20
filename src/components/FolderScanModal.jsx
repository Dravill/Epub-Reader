import React, { useState, useRef } from 'react';
import { FolderSearch, FolderInput, CheckCircle2, AlertCircle, Loader2, X, Library } from 'lucide-react';
import { parseEpub } from '../services/epubParser';
import { saveBook } from '../services/db';

export function FolderScanModal({ isOpen, onClose, onScanComplete, existingBooks = [] }) {
  const [scanning, setScanning] = useState(false);
  const [discoveredFiles, setDiscoveredFiles] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentName: '' });
  const [results, setResults] = useState({ added: 0, skipped: 0, errors: 0 });
  const [completed, setCompleted] = useState(false);
  const folderInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFolderSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    const epubFiles = files.filter(f => f.name.toLowerCase().endsWith('.epub'));

    if (epubFiles.length === 0) {
      alert('No .epub files found in the selected folder.');
      return;
    }

    setDiscoveredFiles(epubFiles);
    setScanning(true);
    setCompleted(false);
    setProgress({ current: 0, total: epubFiles.length, currentName: '' });
    setResults({ added: 0, skipped: 0, errors: 0 });

    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const existingTitles = new Set(existingBooks.map(b => b.title.toLowerCase()));

    for (let i = 0; i < epubFiles.length; i++) {
      const file = epubFiles[i];
      setProgress({
        current: i + 1,
        total: epubFiles.length,
        currentName: file.name
      });

      try {
        // Parse EPUB
        const parsedBook = await parseEpub(file, file.name);
        
        // Skip duplicate by title
        if (existingTitles.has(parsedBook.title.toLowerCase())) {
          skippedCount++;
        } else {
          await saveBook(parsedBook);
          existingTitles.add(parsedBook.title.toLowerCase());
          addedCount++;
        }
      } catch (err) {
        console.error(`Failed to scan ${file.name}:`, err);
        errorCount++;
      }
    }

    setResults({ added: addedCount, skipped: skippedCount, errors: errorCount });
    setScanning(false);
    setCompleted(true);
    if (onScanComplete) onScanComplete();
  };

  const handleReset = () => {
    setScanning(false);
    setCompleted(false);
    setDiscoveredFiles([]);
    setProgress({ current: 0, total: 0, currentName: '' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="brand-container">
            <div className="brand-icon">
              <FolderSearch size={22} />
            </div>
            <h2 className="modal-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Moon+ Style Directory Scan
            </h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {!scanning && !completed && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-light)',
                color: 'var(--accent-purple)', display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: '1.25rem'
              }}>
                <FolderInput size={32} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Scan Folder & Subfolders
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Select a folder on your computer. The scanner will recursively inspect all nested subfolders to find and import all <strong>.epub</strong> books into your library shelf.
              </p>

              <input
                type="file"
                ref={folderInputRef}
                webkitdirectory="true"
                directory="true"
                multiple
                style={{ display: 'none' }}
                onChange={handleFolderSelect}
              />

              <button
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
                onClick={() => folderInputRef.current?.click()}
              >
                <FolderSearch size={18} /> Choose Folder to Scan
              </button>
            </div>
          )}

          {scanning && (
            <div style={{ padding: '1rem 0', textAlign: 'center' }}>
              <Loader2 className="animate-spin" size={40} style={{ color: 'var(--accent-purple)', margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Scanning Library Folder...
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Processing file {progress.current} of {progress.total}
              </p>
              
              {/* Progress Bar */}
              <div style={{
                width: '100%', height: 10, background: 'var(--bg-secondary)',
                borderRadius: 6, overflow: 'hidden', marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-lavender))',
                  transition: 'width 0.2s ease-out'
                }} />
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {progress.currentName}
              </p>
            </div>
          )}

          {completed && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <CheckCircle2 size={48} style={{ color: 'var(--accent-purple)', margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Scan Completed!
              </h4>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem',
                margin: '1.25rem 0', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)'
              }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{results.added}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Books Added</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{results.skipped}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duplicates Skipped</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#EF4444' }}>{results.errors}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Errors</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={handleReset}>
                  Scan Another Folder
                </button>
                <button className="btn btn-primary" onClick={onClose}>
                  Go to Library Shelf
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
