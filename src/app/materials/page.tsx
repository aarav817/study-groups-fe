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
          <p className="page-subtitle">
            Shared notes, practice problems, slide decks, and exam prep organized across course folders.
          </p>
        </div>
        {userGroups.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowFolderModal(true)} className="btn btn-secondary btn-sm">
              + New Folder
            </button>
            <button onClick={() => setShowMaterialModal(true)} className="btn btn-navy btn-sm">
              + Upload File
            </button>
          </div>
        )}
      </div>

      {/* Folder Categories Pill Selector */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
          Folder Directory
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`btn ${selectedFolderId === null ? 'btn-navy' : 'btn-secondary'} btn-xs`}
          >
            All Materials ({materials.length})
          </button>
          {folders.map((f) => {
            const count = materials.filter((m) => m.folder_id === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFolderId(f.id)}
                className={`btn ${selectedFolderId === f.id ? 'btn-navy' : 'btn-secondary'} btn-xs`}
              >
                {f.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '1rem 0' }}>Loading materials...</p>
      ) : filteredMaterials.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', maxWidth: '480px', margin: '1.5rem auto' }}>
          <h2 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>No Materials Found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            {selectedFolderId ? 'No files uploaded in this folder yet.' : 'Materials uploaded in your study groups will be indexed here.'}
          </p>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredMaterials.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-navy">
                    {item.group_title || 'Study Group'}
                  </span>
                  {item.folder_name && (
                    <span className="badge badge-blue">
                      {item.folder_name}
                    </span>
                  )}
                </div>
                <h3 className="card-title" style={{ fontSize: '1.05rem', margin: '0.15rem 0' }}>{item.title}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.35rem 0' }}>
                  <div>Uploaded by {item.uploader_name || 'Member'}</div>
                  <div>Format: {item.file_format.toUpperCase()} • {formatBytes(item.file_size_bytes)}</div>
                </div>
              </div>
              <a
                href={item.file_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-xs"
                style={{ marginTop: '0.75rem', textAlign: 'center' }}
              >
                View Document &rarr;
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="modal-overlay" onClick={() => setShowFolderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create Folder</h2>
            {folderError && <div className="alert-banner alert-danger"><span>{folderError}</span></div>}
            <form onSubmit={handleCreateFolder}>
              <div className="form-group">
                <label>Study Group</label>
                <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} required>
                  {userGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Folder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lecture Notes, Practice Midterms"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowFolderModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-navy btn-sm" disabled={creatingFolder}>{creatingFolder ? 'Creating...' : 'Create Folder'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
      {showMaterialModal && (
        <div className="modal-overlay" onClick={() => setShowMaterialModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Upload Study Material</h2>
            {matError && <div className="alert-banner alert-danger"><span>{matError}</span></div>}
            <form onSubmit={handleUploadMaterial}>
              <div className="form-group">
                <label>Study Group</label>
                <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} required>
                  {userGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select File</label>
                <div className="file-upload-box">
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--primary-navy)' }}>
                    {selectedFileName ? `Selected: ${selectedFileName}` : 'Choose File to Upload'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    PDF, DOCX, PPTX, TXT, ZIP, Images
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
                  placeholder="e.g. Problem Set 2 Solutions"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  required
                />
              </div>

              {folders.length > 0 && (
                <div className="form-group">
                  <label>Assign to Folder (Optional)</label>
                  <select value={matFolderId} onChange={(e) => setMatFolderId(e.target.value)}>
                    <option value="">No Folder (General)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowMaterialModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-navy btn-sm" disabled={uploadingMat}>{uploadingMat ? 'Uploading...' : 'Upload File'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
