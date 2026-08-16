import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FileViewerModal, { formatBytes, getFileCategory, getFormatBadgeStyle } from '../src/components/FileViewerModal';

describe('FileViewerModal & Material Display (Jest + React Testing Library)', () => {
  test('formats byte sizes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(5242880)).toBe('5 MB');
    expect(formatBytes(0)).toBe('0 B');
  });

  test('categorizes file formats correctly', () => {
    expect(getFileCategory('pdf', 'https://example.com/test.pdf')).toBe('pdf');
    expect(getFileCategory('mp4', 'https://example.com/video.mp4')).toBe('video');
    expect(getFileCategory('png', 'https://example.com/pic.png')).toBe('image');
    expect(getFileCategory('docx', 'https://example.com/doc.docx')).toBe('doc');
    expect(getFileCategory('txt', 'data:text/plain;base64,SGVsbG8=')).toBe('text');
    expect(getFileCategory('zip', 'https://example.com/archive.zip')).toBe('archive');
  });

  test('renders PDF viewer modal and responds to download and close events', () => {
    const mockMaterial = {
      id: 'mat-1',
      title: 'Week 1 Lecture Notes',
      file_format: 'pdf',
      file_size_bytes: 2048576,
      file_url: 'https://storage.example.com/notes.pdf',
      uploader_name: 'Alex Morgan',
    };

    const handleClose = jest.fn();
    const handleDownload = jest.fn();

    render(
      <FileViewerModal
        material={mockMaterial}
        onClose={handleClose}
        onDownload={handleDownload}
      />
    );

    expect(screen.getByText('Week 1 Lecture Notes')).toBeInTheDocument();
    expect(screen.getByText(/Alex Morgan/i)).toBeInTheDocument();
    expect(screen.getByText(/2 MB/i)).toBeInTheDocument();

    const downloadButtons = screen.getAllByRole('button', { name: /download/i });
    expect(downloadButtons.length).toBeGreaterThan(0);
    fireEvent.click(downloadButtons[0]);
    expect(handleDownload).toHaveBeenCalledTimes(1);

    const closeButton = screen.getByTitle(/close preview/i);
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('renders Video player for video formats', () => {
    const mockVideo = {
      id: 'vid-1',
      title: 'Machine Learning Lecture 3 Video',
      file_format: 'mp4',
      file_size_bytes: 52428800,
      file_url: 'https://storage.example.com/lecture3.mp4',
      uploader_name: 'Professor Smith',
    };

    render(
      <FileViewerModal
        material={mockVideo}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Machine Learning Lecture 3 Video')).toBeInTheDocument();
    expect(screen.getByText('MP4')).toBeInTheDocument();
  });
});
