'use client';

import React, { useState, useEffect, use } from 'react';
import { api } from '@/lib/api';

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

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const res = await api.users.getUserById(userId);
        if (res.success && res.data?.user) {
          setProfile(res.data.user);
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
    return <div style={{ padding: '2rem 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Loading user profile...</div>;
  }

  if (!profile) {
    return <div style={{ padding: '2rem 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>User profile not found.</div>;
  }

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-strong)' }}
            />
          ) : (
            <div className="avatar-circle" style={{ width: '56px', height: '56px', fontSize: '1.25rem' }}>
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="page-title" style={{ fontSize: '1.35rem', margin: 0 }}>{profile.full_name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{profile.email}</p>
            {profile.messaging_code && (
              <span className="badge badge-navy" style={{ marginTop: '0.25rem' }}>
                Code: {profile.messaging_code}
              </span>
            )}
          </div>
        </div>

        {profile.bio && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              About
            </div>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.8125rem', lineHeight: 1.5 }}>{profile.bio}</p>
          </div>
        )}

        {profile.joined_groups && profile.joined_groups.length > 0 && (
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Enrolled Groups ({profile.joined_groups.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {profile.joined_groups.map((g) => (
                <div key={g.id} style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--primary-navy)' }}>{g.title}</span>
                  <span className="badge badge-blue">{g.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
