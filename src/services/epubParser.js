import JSZip from 'jszip';

/**
 * Parses an EPUB File or ArrayBuffer and returns structured book object
 */
export async function parseEpub(fileOrBuffer, fileName = 'Unknown Book') {
  let zip;
  let arrayBuffer;

  if (fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else {
    throw new Error('Invalid file format. Expected File or ArrayBuffer.');
  }

  zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Locate container.xml to find OPF path
  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Invalid EPUB file: META-INF/container.xml missing.');
  }

  const containerText = await containerFile.async('text');
  const domParser = new DOMParser();
  const containerDoc = domParser.parseFromString(containerText, 'text/xml');
  const rootfileEl = containerDoc.querySelector('rootfile');

  if (!rootfileEl) {
    throw new Error('Invalid EPUB: OPF rootfile path not found in container.xml.');
  }

  const opfPath = rootfileEl.getAttribute('full-path');
  const opfFolder = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // 2. Read OPF Package File
  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error(`OPF file not found at ${opfPath}`);
  }

  const opfText = await opfFile.async('text');
  const opfDoc = domParser.parseFromString(opfText, 'text/xml');

  // 3. Extract Metadata
  const metadataEl = opfDoc.querySelector('metadata') || opfDoc.querySelector('dc-metadata');
  const title = getXmlText(metadataEl, 'dc\\:title, title') || fileName.replace(/\.epub$/i, '');
  const author = getXmlText(metadataEl, 'dc\\:creator, creator') || 'Unknown Author';
  const language = getXmlText(metadataEl, 'dc\\:language, language') || 'en';
  const description = getXmlText(metadataEl, 'dc\\:description, description') || '';
  const publisher = getXmlText(metadataEl, 'dc\\:publisher, publisher') || '';

  // 4. Manifest Items & Spine
  const manifestItems = Array.from(opfDoc.querySelectorAll('manifest > item')).map(el => ({
    id: el.getAttribute('id'),
    href: el.getAttribute('href'),
    mediaType: el.getAttribute('media-type'),
    properties: el.getAttribute('properties') || ''
  }));

  const spineItems = Array.from(opfDoc.querySelectorAll('spine > itemref')).map(el => ({
    idref: el.getAttribute('idref')
  }));

  // 5. Extract Cover Image
  let coverDataUrl = null;
  const coverMeta = opfDoc.querySelector('meta[name="cover"]');
  let coverId = coverMeta ? coverMeta.getAttribute('content') : null;

  if (!coverId) {
    const coverManifest = manifestItems.find(item => item.properties.includes('cover-image') || item.id.toLowerCase().includes('cover'));
    if (coverManifest) coverId = coverManifest.id;
  }

  if (coverId) {
    const coverItem = manifestItems.find(item => item.id === coverId);
    if (coverItem) {
      const fullCoverPath = resolveRelativePath(opfFolder, coverItem.href);
      const coverZipFile = zip.file(fullCoverPath);
      if (coverZipFile) {
        const coverBase64 = await coverZipFile.async('base64');
        coverDataUrl = `data:${coverItem.mediaType};base64,${coverBase64}`;
      }
    }
  }

  // 6. Inline Image Map (only lightweight images mapped)
  const imageMap = {};
  const imageItems = manifestItems.filter(item => item.mediaType && item.mediaType.startsWith('image/'));
  for (const imgItem of imageItems) {
    const fullImgPath = resolveRelativePath(opfFolder, imgItem.href);
    const imgZip = zip.file(fullImgPath);
    if (imgZip) {
      const b64 = await imgZip.async('base64');
      const dataUri = `data:${imgItem.mediaType};base64,${b64}`;
      imageMap[fullImgPath] = dataUri;
      imageMap[imgItem.href] = dataUri;
    }
  }

  // 7. Parse Chapters Spine
  const chapters = [];
  const toc = [];

  for (let i = 0; i < spineItems.length; i++) {
    const idref = spineItems[i].idref;
    const manifestItem = manifestItems.find(item => item.id === idref);
    if (!manifestItem) continue;

    const fullChapterPath = resolveRelativePath(opfFolder, manifestItem.href);
    const chapterFile = zip.file(fullChapterPath);
    if (!chapterFile) continue;

    const rawHtml = await chapterFile.async('text');
    
    // Parse chapter doc to clean up & inline images
    const chapterDoc = domParser.parseFromString(rawHtml, 'text/html');
    
    const chapTitleEl = chapterDoc.querySelector('h1, h2, title');
    const chapTitle = chapTitleEl ? chapTitleEl.textContent.trim() : `Chapter ${i + 1}`;

    // Process inline images
    const imgEls = chapterDoc.querySelectorAll('img, image');
    imgEls.forEach(img => {
      const srcAttr = img.getAttribute('src') || img.getAttribute('xlink:href');
      if (srcAttr) {
        const resolvedSrc = resolveRelativePath(getFileFolder(fullChapterPath), srcAttr);
        if (imageMap[resolvedSrc]) {
          img.setAttribute('src', imageMap[resolvedSrc]);
        } else if (imageMap[srcAttr]) {
          img.setAttribute('src', imageMap[srcAttr]);
        }
      }
    });

    const bodyContent = chapterDoc.body ? chapterDoc.body.innerHTML : rawHtml;

    chapters.push({
      index: i,
      id: idref,
      href: manifestItem.href,
      title: chapTitle,
      content: bodyContent
    });

    toc.push({
      index: i,
      title: chapTitle,
      href: manifestItem.href
    });
  }

  const bookId = 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

  return {
    id: bookId,
    title,
    author,
    language,
    description,
    publisher,
    coverDataUrl,
    totalChapters: chapters.length,
    chapters,
    toc,
    addedAt: Date.now()
  };
}

function getXmlText(parentEl, selector) {
  if (!parentEl) return null;
  const selectors = selector.split(',').map(s => s.trim());
  for (const sel of selectors) {
    const el = parentEl.querySelector(sel);
    if (el && el.textContent.trim()) return el.textContent.trim();
  }
  return null;
}

function resolveRelativePath(baseFolder, relativePath) {
  if (!baseFolder) return relativePath;
  const stack = baseFolder.split('/').filter(Boolean);
  const parts = relativePath.split('/');
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}

function getFileFolder(filePath) {
  if (!filePath.includes('/')) return '';
  return filePath.substring(0, filePath.lastIndexOf('/') + 1);
}
