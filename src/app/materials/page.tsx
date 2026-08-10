'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface MaterialItem {
  id: string;
  title: string;
  file_format: string;
  file_size_bytes: number | string;
  file_url: string;
  created_at: string;
  group_title?: string;
  uploader_name?: string;
  folder_id?: string | null;
  folder_name?: string | null;
}

interface MaterialFolder {
  id: string;
  name: string;
  group_id?: string;
  group_title?: string;
}

interface UserGroup {
  id: string;
  title: string;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [folders, setFolders] = useState<MaterialFolder[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Modals
  const [showMaterialModal, setShowMaterialModal] = useState<boolean>(false);
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // Material upload state
  const [matTitle, setMatTitle] = useState<string>('');
  const [matFormat, setMatFormat] = useState<string>('pdf');
  const [matUrl, setMatUrl] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(500 * 1024);
  const [matFolderId, setMatFolderId] = useState<string>('');
  const [matError, setMatError] = useState<string>('');
  const [uploadingMat, setUploadingMat] = useState<boolean>(false);

  // Folder creation state
  const [folderName, setFolderName] = useState<string>('');
  const [folderError, setFolderError] = useState<string>('');
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);

  const loadMaterialsAndFolders = async () => {
    try {
      setLoading(true);
      const [mRes, gRes] = await Promise.allSettled([
        api.materials.getAllMaterials(),
        api.groups.list(),
      ]);

      if (mRes.status === 'fulfilled' && mRes.value?.success && mRes.value.data) {
        setMaterials(mRes.value.data.materials || []);
        setFolders(mRes.value.data.folders || []);
      }
      if (gRes.status === 'fulfilled' && gRes.value?.success && gRes.value.data?.groups) {
        setUserGroups(gRes.value.data.groups);
        if (gRes.value.data.groups.length > 0 && !selectedGroupId) {
          setSelectedGroupId(gRes.value.data.groups[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load study materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterialsAndFolders();
  }, []);

  const handleFilePromptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setFileSizeBytes(file.size);
    if (!matTitle) {
      setMatTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    setMatFormat(ext);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setMatUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setMatError('');

    if (!selectedGroupId || !matTitle.trim() || (!matUrl && !selectedFileName)) {
      setMatError('Please select a group and choose a file to upload.');
      return;
    }

    try {
      setUploadingMat(true);
      const res = await api.materials.upload(selectedGroupId, {
        title: matTitle.trim(),
        file_format: matFormat,
        file_url: matUrl || `https://storage.example.com/${selectedFileName}`,
        folder_id: matFolderId || undefined,
        file_size_bytes: fileSizeBytes,
      });

      if (res.success) {
        setShowMaterialModal(false);
        setMatTitle('');
        setMatUrl('');
        setSelectedFileName('');
        setMatFolderId('');
        loadMaterialsAndFolders();
      } else {
        setMatError(res.error?.message || 'Failed to upload material.');
      }
    } catch (err: any) {
      setMatError(err.message || 'Failed to upload material.');
    } finally {
      setUploadingMat(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFolderError('');

    if (!selectedGroupId || !folderName.trim()) {
      setFolderError('Group and folder name are required.');
      return;
    }

    try {
      setCreatingFolder(true);
      const res = await api.materials.createFolder(selectedGroupId, { name: folderName.trim() });
      if (res.success) {
        setShowFolderModal(false);
        setFolderName('');
        loadMaterialsAndFolders();
      } else {
        setFolderError(res.error?.message || 'Failed to create folder.');
      }
    } catch (err: any) {
      setFolderError(err.message || 'Failed to create folder.');
    } finally {
      setCreatingFolder(false);
    }
  };

  const formatBytes = (bytes: number | string) => {
    const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (!num || isNaN(num)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredMaterials = selectedFolderId
    ? materials.filter((m) => m.folder_id === selectedFolderId)
    : materials;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Study Materials Library</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Shared lecture notes, practice exams, and PDF resources organized in folder hierarchies.
          </p>
        </div>
        {userGroups.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setShowFolderModal(true)} className="btn btn-secondary">
              📁 + Create Folder
            </button>
            <button onClick={() => setShowMaterialModal(true)} className="btn btn-primary">
              + Upload Material
            </button>
          </div>
        )}
      </div>

      {/* Folder Hierarchy Selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          Folder Hierarchy & Categories
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`btn ${selectedFolderId === null ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            📁 All Materials ({materials.length})
          </button>
          {folders.map((f) => {
            const count = materials.filter((m) => m.folder_id === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFolderId(f.id)}
                className={`btn ${selectedFolderId === f.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              >
                📁 {f.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p>Loading study materials...</p>
      ) : filteredMaterials.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', maxWidth: '600px', margin: '2rem auto' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Materials Found</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {selectedFolderId ? 'No materials uploaded in this folder yet.' : 'Materials uploaded in your study groups will be organized here.'}
          </p>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredMaterials.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  <span className="badge badge-emerald">
                    {item.group_title || 'Study Group'}
                  </span>
                  {item.folder_name && (
                    <span className="badge badge-purple">
                      📁 {item.folder_name}
                    </span>
                  )}
                </div>
                <h3 className="card-title">{item.title}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
                  <div>Uploaded by {item.uploader_name || 'Member'}</div>
                  <div>Format: {item.file_format.toUpperCase()} • {formatBytes(item.file_size_bytes)}</div>
                </div>
              </div>
              <a
                href={item.file_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '1rem', textAlign: 'center' }}
              >
                Download / View Material &rarr;
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="modal-overlay" onClick={() => setShowFolderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Create Material Folder</h2>
            {folderError && <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--accent-rose-bg)', color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '1rem' }}>{folderError}</div>}
            <form onSubmit={handleCreateFolder}>
              <div className="form-group">
                <label>Select Study Group</label>
                <select className="form-control" value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} required>
                  {userGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Folder Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Lecture Notes, Exam Reviews, Problem Sets"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFolderModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingFolder}>{creatingFolder ? 'Creating...' : 'Create Folder'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
      {showMaterialModal && (
        <div className="modal-overlay" onClick={() => setShowMaterialModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Upload Study Material</h2>
            {matError && <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--accent-rose-bg)', color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '1rem' }}>{matError}</div>}
            <form onSubmit={handleUploadMaterial}>
              <div className="form-group">
                <label>Select Study Group</label>
                <select className="form-control" value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} required>
                  {userGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              {/* File Upload Dropzone Prompt */}
              <div className="form-group">
                <label>Choose File to Upload</label>
                <div className="file-upload-box">
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📁</div>
                  <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                    {selectedFileName ? `Selected: ${selectedFileName}` : 'Click or Drag File Here to Upload'}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.docx,.pptx,.txt,.zip,image/*"
                    onChange={handleFilePromptSelect}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Document Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Lecture 5 Notes or Midterm 2 Solution Key"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  required
                />
              </div>

              {folders.length > 0 && (
                <div className="form-group">
                  <label>Assign to Folder (Optional)</label>
                  <select className="form-control" value={matFolderId} onChange={(e) => setMatFolderId(e.target.value)}>
                    <option value="">No Folder (General Materials)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMaterialModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploadingMat}>{uploadingMat ? 'Uploading...' : 'Upload Material'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
