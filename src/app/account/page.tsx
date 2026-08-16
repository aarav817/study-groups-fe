'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';

export default function AccountPage() {
  const { user, setUser } = useAuth();

  const [fullName, setFullName] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      setSaving(true);
      const res = await api.users.updateProfile({
        full_name: fullName,
        bio,
        avatar_url: avatarUrl,
      });

      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setMessage('Profile updated successfully.');
      } else {
        setError(res.error?.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  const copyCode = () => {
    if (user?.messaging_code) {
      navigator.clipboard.writeText(user.messaging_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return <div style={{ padding: '2rem 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Please log in to view your account.</div>;
  }

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Profile</h1>
          <p className="page-subtitle">
            Manage your personal profile, avatar photo, and bio.
          </p>
        </div>
      </div>

      <div className="card">
        {message && <div className="alert-banner alert-success"><span>{message}</span></div>}
        {error && <div className="alert-banner alert-danger"><span>{error}</span></div>}

        {/* Messaging Code Card */}
        <div style={{
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '0.875rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Direct Messaging Code
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--primary-navy)', marginTop: '0.15rem' }}>
              {user.messaging_code}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Classmates enter this code to request a private direct chat.
            </div>
          </div>
          <button type="button" onClick={copyCode} className="btn btn-secondary btn-xs">
            {copied ? 'Copied' : 'Copy Code'}
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* Avatar Upload Dropzone & Circle Preview */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="avatarFileInput">Upload Profile Photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem' }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-strong)' }}
                />
              ) : (
                <div className="avatar-circle" style={{ width: '56px', height: '56px', fontSize: '1.25rem' }}>
                  {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div className="file-upload-box" style={{ flex: 1, padding: '0.75rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.78125rem', color: 'var(--primary-navy)' }}>
                  Choose Image File
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  PNG, JPG, WEBP
                </div>
                <input id="avatarFileInput" type="file" accept="image/*" onChange={handleAvatarFileSelect} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="userEmail">Email</label>
            <input id="userEmail" type="text" value={user.email} disabled style={{ backgroundColor: 'var(--bg-subtle)', cursor: 'not-allowed', color: 'var(--text-muted)' }} />
          </div>

          <div className="form-group">
            <label htmlFor="userFullName">Full Name</label>
            <input
              id="userFullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="userBio">Bio / Study Interests</label>
            <textarea
              id="userBio"
              rows={3}
              placeholder="Tell your classmates about your major, interests, or current courses..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-navy btn-sm" style={{ marginTop: '0.25rem' }} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
