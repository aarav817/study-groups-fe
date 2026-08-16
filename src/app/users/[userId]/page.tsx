'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  bio?: string | null;
  avatar_url?: string | null;
  messaging_code?: string;
  joined_groups?: { id: string; title: string; role: string }[];
}

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Privacy visibility settings
  const [emailVisibility, setEmailVisibility] = useState<'private' | 'public'>('private');
  const [messagingCodeVisibility, setMessagingCodeVisibility] = useState<'private' | 'public'>('private');

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const res = await api.users.getUserById(userId);
        if (res.success && res.data?.user) {
          setProfile(res.data.user);
        }

        if (typeof window !== 'undefined') {
          const savedPrivacy = localStorage.getItem(`privacy_settings_${userId}`);
          if (savedPrivacy) {
            try {
              const parsed = JSON.parse(savedPrivacy);
              if (parsed.emailVisibility) setEmailVisibility(parsed.emailVisibility);
              if (parsed.messagingCodeVisibility) setMessagingCodeVisibility(parsed.messagingCodeVisibility);
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [userId]);

  if (loading) {
    return (
      <div style={{ maxWidth: '580px', margin: '0 auto', padding: '2rem 0', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        Loading student profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ maxWidth: '580px', margin: '0 auto', padding: '2rem 0', textAlign: 'center' }}>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>Student profile not found.</p>
          <Link href="/groups" className="btn btn-secondary btn-sm">
            &larr; Back to Groups
          </Link>
        </div>
      </div>
    );
  }

  const isOwnerViewer = currentUser?.id === userId;
  const showEmail = isOwnerViewer || emailVisibility === 'public';
  const showMessagingCode = isOwnerViewer || messagingCodeVisibility === 'public';

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto' }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <button
          onClick={() => window.history.back()}
          className="btn btn-secondary btn-xs"
          style={{ cursor: 'pointer' }}
        >
          &larr; Back
        </button>
      </div>

      <div className="card">
        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-default)', flexShrink: 0 }}
            />
          ) : (
            <div className="avatar-circle" style={{ width: '56px', height: '56px', fontSize: '1.25rem', flexShrink: 0 }}>
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="page-title" style={{ fontSize: '1.35rem', margin: 0, color: 'var(--primary-navy)' }}>
              {profile.full_name}
            </h1>
            
            {showEmail && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.15rem' }}>
                {profile.email}
                {isOwnerViewer && emailVisibility === 'private' && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                    (Private to other students)
                  </span>
                )}
              </p>
            )}

            {showMessagingCode && profile.messaging_code && (
              <div style={{ marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="badge badge-navy">
                  Code: {profile.messaging_code}
                </span>
                {isOwnerViewer && messagingCodeVisibility === 'private' && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    (Private to other students)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio / Study Interests */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Academic Bio & Study Focus
          </div>
          {profile.bio ? (
            <p style={{ color: 'var(--text-primary)', fontSize: '0.8125rem', lineHeight: 1.5 }}>
              {profile.bio}
            </p>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78125rem', fontStyle: 'italic' }}>
              No bio provided yet.
            </p>
          )}
        </div>

        {/* Enrolled Groups */}
        {profile.joined_groups && profile.joined_groups.length > 0 && (
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
              Enrolled Study Groups ({profile.joined_groups.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {profile.joined_groups.map((g) => (
                <div
                  key={g.id}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--primary-navy)' }}>
                    {g.title}
                  </span>
                  <span className={`badge ${g.role === 'owner' ? 'badge-navy' : g.role === 'admin' ? 'badge-amber' : 'badge-blue'}`}>
                    {g.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
