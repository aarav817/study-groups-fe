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
        setMessage('Profile updated successfully!');
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
    return <div style={{ padding: '2rem' }}>Please log in to view your account.</div>;
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Account & Profile</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage your personal profile, avatar photo upload, bio, and direct messaging code.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        {message && <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--accent-emerald-bg)', color: 'var(--accent-emerald)', fontSize: '0.875rem', marginBottom: '1rem' }}>{message}</div>}
        {error && <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--accent-rose-bg)', color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}

        {/* Messaging Code Card */}
        <div style={{
          backgroundColor: 'var(--panel-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Your Direct Messaging Code
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--primary-color)', marginTop: '0.25rem' }}>
              {user.messaging_code}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
              Classmates enter this code to request a private chat with you.
            </div>
          </div>
          <button type="button" onClick={copyCode} className="btn btn-secondary btn-sm">
            {copied ? 'Copied! ✓' : 'Copy Code'}
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* Avatar Upload Dropzone & Circle Preview */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Profile Avatar Photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.5rem' }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-color)' }}
                />
              ) : (
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.75rem' }}>
                  {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div className="file-upload-box" style={{ flex: 1, padding: '1rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-color)' }}>
                  📁 Choose Image File
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Click or drag photo here (PNG, JPG, WEBP)
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarFileSelect} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>University Email</label>
            <input type="text" value={user.email} disabled style={{ backgroundColor: 'var(--panel-bg)', cursor: 'not-allowed' }} />
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Bio / Academic Interests</label>
            <textarea
              rows={3}
              placeholder="Tell your classmates about your major, interests, or courses..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
