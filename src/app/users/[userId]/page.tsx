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
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading user profile...</div>;
  }

  if (!profile) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>User profile not found.</div>;
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="page-title">{profile.full_name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{profile.email}</p>
            {profile.messaging_code && (
              <span className="badge badge-purple" style={{ marginTop: '0.35rem' }}>
                Code: {profile.messaging_code}
              </span>
            )}
          </div>
        </div>

        {profile.bio && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>About & Bio</h3>
            <p style={{ color: 'var(--text-color)', lineHeight: 1.6 }}>{profile.bio}</p>
          </div>
        )}

        {profile.joined_groups && profile.joined_groups.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Joined Study Groups ({profile.joined_groups.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {profile.joined_groups.map((g) => (
                <div key={g.id} style={{ padding: '0.625rem 0.875rem', backgroundColor: 'var(--panel-bg)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.title}</span>
                  <span className="badge badge-emerald">{g.role.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
