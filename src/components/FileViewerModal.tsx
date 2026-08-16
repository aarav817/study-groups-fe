'use client';

import React, { useState, useEffect } from 'react';

export interface ViewableMaterial {
  id: string;
  title: string;
  file_format: string;
  file_size_bytes?: number | string;
  file_url: string;
  uploader_name?: string;
  group_title?: string;
  created_at?: string;
}

interface FileViewerModalProps {
  material: ViewableMaterial | null;
  onClose: () => void;
  onDownload?: (material: ViewableMaterial) => void;
}

export function formatBytes(bytes: number | string | undefined): string {
  if (bytes === undefined || bytes === null) return 'Unknown size';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (!num || isNaN(num)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return parseFloat((num / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFormatBadgeStyle(format: string): { bg: string; text: string; border: string } {
  const fmt = (format || '').toLowerCase().trim();
  switch (fmt) {
    case 'pdf':
      return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
    case 'doc':
    case 'docx':
    case 'ppt':
    case 'pptx':
    case 'xls':
    case 'xlsx':
      return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' };
    case 'mp4':
    case 'webm':
    case 'mov':
    case 'm4v':
    case 'mkv':
    case 'avi':
      return { bg: '#ede9fe', text: '#5b21b6', border: '#ddd6fe' };
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'm4a':
    case 'aac':
      return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
      return { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' };
    case 'txt':
    case 'md':
    case 'json':
    case 'csv':
    case 'py':
    case 'js':
    case 'ts':
    case 'tsx':
    case 'jsx':
    case 'html':
    case 'css':
    case 'sql':
      return { bg: '#ccfbf1', text: '#115e59', border: '#99f6e4' };
    case 'zip':
    case 'tar':
    case 'gz':
    case 'rar':
    case '7z':
      return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
    default:
      return { bg: '#e0edfd', text: '#0f294a', border: '#9ec0e2' };
  }
}

export function getFileCategory(format: string, url: string): 'pdf' | 'video' | 'audio' | 'image' | 'text' | 'doc' | 'archive' | 'other' {
  const fmt = (format || '').toLowerCase().trim();
  if (fmt === 'pdf' || url.startsWith('data:application/pdf')) return 'pdf';
  if (['mp4', 'webm', 'ogg', 'mov', 'm4v', 'mkv', 'avi'].includes(fmt) || url.startsWith('data:video/')) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(fmt) || url.startsWith('data:audio/')) return 'audio';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(fmt) || url.startsWith('data:image/')) return 'image';
  if (['txt', 'md', 'markdown', 'json', 'csv', 'py', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'sql', 'sh', 'log', 'xml', 'yaml', 'yml'].includes(fmt) || url.startsWith('data:text/')) return 'text';
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'pages', 'key', 'numbers'].includes(fmt)) return 'doc';
  if (['zip', 'tar', 'gz', 'rar', '7z', 'bz2'].includes(fmt)) return 'archive';
  return 'other';
}

export default function FileViewerModal({ material, onClose, onDownload }: FileViewerModalProps) {
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string>('');
  const [loadingText, setLoadingText] = useState<boolean>(false);

  const category = material ? getFileCategory(material.file_format, material.file_url) : 'other';
  const badgeStyle = material ? getFormatBadgeStyle(material.file_format) : { bg: '#eee', text: '#333', border: '#ccc' };

  useEffect(() => {
    if (!material) return;

    // Decode or load text content if text/code format
    if (category === 'text') {
      const url = material.file_url;
      if (url.startsWith('data:')) {
        try {
          if (url.includes(';base64,')) {
            const b64 = url.split(';base64,')[1];
            const decoded = decodeURIComponent(escape(atob(b64)));
            setTextContent(decoded);
          } else {
            const parts = url.split(',');
            setTextContent(decodeURIComponent(parts[1] || ''));
          }
        } catch (e) {
          try {
            const b64 = url.split(';base64,')[1] || '';
            setTextContent(atob(b64));
          } catch (err2) {
            setTextContent('Unable to decode text data format.');
          }
        }
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        // If simulated storage URL or remote file, try to fetch or fallback
        setLoadingText(true);
        fetch(url)
          .then((res) => {
            if (res.ok) return res.text();
            throw new Error('Failed to fetch text file');
          })
          .then((text) => setTextContent(text))
          .catch(() => {
            setTextContent(`File preview for ${material.title} (${material.file_format.toUpperCase()}). Click 'Download' or 'Open in New Tab' to view the full file content.`);
          })
          .finally(() => setLoadingText(false));
      } else {
        setTextContent(url);
      }
    }
  }, [material, category]);

  if (!material) return null;

  const handleDownload = () => {
    if (onDownload) {
      onDownload(material);
      return;
    }
    const link = document.createElement('a');
    link.href = material.file_url;
    const ext = material.file_format ? material.file_format.toLowerCase() : 'pdf';
    const cleanTitle = material.title.replace(/[/\\?%*:|"<>]/g, '_');
    const filename = cleanTitle.toLowerCase().endsWith(`.${ext}`) ? cleanTitle : `${cleanTitle}.${ext}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const isDataUrl = material.file_url.startsWith('data:');

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 250,
        backgroundColor: 'rgba(15, 34, 56, 0.65)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '880px',
          width: '92vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-dropdown)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            paddingBottom: '0.85rem',
            borderBottom: '1px solid var(--border-default)',
            marginBottom: '1rem',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: badgeStyle.bg,
                  color: badgeStyle.text,
                  border: `1px solid ${badgeStyle.border}`,
                  letterSpacing: '0.5px',
                }}
              >
                {material.file_format.toUpperCase()}
              </span>
              <h2
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: 'var(--primary-navy)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '520px',
                }}
                title={material.title}
              >
                {material.title}
              </h2>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {material.uploader_name && <span>Uploaded by <strong>{material.uploader_name}</strong> • </span>}
              <span>{formatBytes(material.file_size_bytes)}</span>
              {material.group_title && <span> • Group: {material.group_title}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            <button
              onClick={handleDownload}
              className="btn btn-secondary btn-xs"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
              title="Download file to device"
            >
              <svg style={{ width: '13px', height: '13px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download</span>
            </button>

            {!isDataUrl && (
              <a
                href={material.file_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-xs"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                title="Open in new window"
              >
                <span>External</span>
                <svg style={{ width: '11px', height: '11px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}

            <button
              onClick={onClose}
              className="icon-btn"
              style={{ width: '28px', height: '28px', fontSize: '0.9rem' }}
              title="Close Preview (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div
          style={{
            flex: 1,
            minHeight: '340px',
            maxHeight: 'calc(92vh - 150px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            position: 'relative',
          }}
        >
          {/* 1. PDF Viewer */}
          {category === 'pdf' && (
            <div style={{ width: '100%', height: '65vh', display: 'flex', flexDirection: 'column' }}>
              <iframe
                src={`${material.file_url}#toolbar=1&navpanes=0`}
                title={material.title}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
          )}

          {/* 2. Video Player */}
          {category === 'video' && (
            <div
              style={{
                width: '100%',
                maxHeight: '65vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000000',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <video
                controls
                autoPlay={false}
                src={material.file_url}
                style={{ maxWidth: '100%', maxHeight: '65vh', width: '100%' }}
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>
          )}

          {/* 3. Audio Player */}
          {category === 'audio' && (
            <div
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.25rem',
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-subtle)',
                  border: '2px solid var(--border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-color)',
                }}
              >
                <svg style={{ width: '36px', height: '36px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.2rem' }}>
                  {material.title}
                </h3>
                <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                  Audio Track • {material.file_format.toUpperCase()}
                </p>
              </div>
              <audio controls src={material.file_url} style={{ width: '100%', maxWidth: '480px' }} />
            </div>
          )}

          {/* 4. Image Viewer */}
          {category === 'image' && (
            <div
              style={{
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '380px',
                maxHeight: '65vh',
                overflow: 'auto',
              }}
            >
              <img
                src={material.file_url}
                alt={material.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-md)',
                }}
              />
            </div>
          )}

          {/* 5. Text & Code Viewer */}
          {category === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '60vh' }}>
              <div
                style={{
                  padding: '0.5rem 0.85rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderBottom: '1px solid var(--border-default)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>File Content ({material.file_format.toUpperCase()})</span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="btn btn-secondary btn-xs"
                  style={{ fontSize: '0.6875rem' }}
                >
                  {copiedText ? '✓ Copied' : 'Copy Text'}
                </button>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '1rem',
                  overflow: 'auto',
                  backgroundColor: '#ffffff',
                  fontFamily: 'monospace, "Courier New", Courier',
                  fontSize: '0.8125rem',
                  lineHeight: '1.5',
                  color: '#1e293b',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {loadingText ? (
                  <div style={{ color: 'var(--text-muted)', padding: '1rem' }}>Loading text content...</div>
                ) : (
                  textContent || 'No text content available.'
                )}
              </div>
            </div>
          )}

          {/* 6. Office Documents (Word, PowerPoint, Excel) */}
          {category === 'doc' && (
            <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
              {!isDataUrl && (material.file_url.startsWith('http://') || material.file_url.startsWith('https://')) && !material.file_url.includes('storage.example.com') ? (
                <div style={{ width: '100%', height: '65vh', display: 'flex', flexDirection: 'column' }}>
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(material.file_url)}&embedded=true`}
                    title={material.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#ffffff',
                    }}
                  />
                </div>
              ) : (
                <div style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: badgeStyle.bg,
                      border: `1px solid ${badgeStyle.border}`,
                      color: badgeStyle.text,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg style={{ width: '32px', height: '32px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
                      {material.title}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                      This is a <strong>{material.file_format.toUpperCase()}</strong> document ({formatBytes(material.file_size_bytes)}). Download the file to view and edit in Word, Excel, PowerPoint, or Google Docs.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button onClick={handleDownload} className="btn btn-navy btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>Download Document</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. Archive & Others */}
          {(category === 'archive' || category === 'other') && (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: badgeStyle.bg,
                  border: `1px solid ${badgeStyle.border}`,
                  color: badgeStyle.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg style={{ width: '32px', height: '32px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
                  {material.title}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                  {category === 'archive' ? 'Compressed Archive File' : 'Binary File'} ({material.file_format.toUpperCase()} • {formatBytes(material.file_size_bytes)}).
                  Download the file to extract or open on your device.
                </p>
              </div>
              <button onClick={handleDownload} className="btn btn-navy btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download File</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-default)',
            marginTop: '1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Direct link: </span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.6875rem' }}>
              {isDataUrl ? 'Local Embedded Data' : material.file_url.slice(0, 50) + (material.file_url.length > 50 ? '...' : '')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Close
            </button>
            <button type="button" onClick={handleDownload} className="btn btn-navy btn-sm">
              Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
