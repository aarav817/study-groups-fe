'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface StudyGroup {
  id: string;
  title: string;
  description?: string | null;
  is_public: boolean;
  member_count?: number;
  is_member?: boolean;
  creator_name?: string;
}

export default function GroupsPage() {
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [publicGroups, setPublicGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewTab, setViewTab] = useState<'my' | 'public'>('my');
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [createError, setCreateError] = useState<string>('');

  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteInput, setInviteInput] = useState<string>('');
  const [inviteError, setInviteError] = useState<string>('');
  const [joinError, setJoinError] = useState<string>('');

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const [myRes, publicRes] = await Promise.allSettled([
        api.groups.list(searchQuery),
        api.groups.listPublic(searchQuery),
      ]);

      let userJoinedGroups: StudyGroup[] = [];
      if (myRes.status === 'fulfilled' && myRes.value?.success) {
        userJoinedGroups = myRes.value.data?.groups || [];
        setMyGroups(userJoinedGroups);
      }

      if (publicRes.status === 'fulfilled' && publicRes.value?.success) {
        setPublicGroups(publicRes.value.data?.groups || []);
      }

      if (userJoinedGroups.length === 0) {
        setViewTab('public');
      }
    } catch (err) {
      console.error('Failed to load study groups:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    try {
      const res = await api.groups.create({
        title: newTitle,
        description: newDescription,
        is_public: isPublic,
      });
      if (res.success) {
        setShowCreateModal(false);
        setNewTitle('');
        setNewDescription('');
        setIsPublic(true);
        setViewTab('my');
        fetchGroups();
      } else {
        setCreateError(res.error?.message || 'Failed to create group.');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create group.');
    }
  };

  const handleJoinPublicGroup = async (groupId: string) => {
    setJoinError('');
    try {
      setJoiningGroupId(groupId);
      const res = await api.memberships.joinGroup(groupId);
      if (res.success) {
        setViewTab('my');
        fetchGroups();
      } else {
        setJoinError(res.error?.message || 'Failed to join group.');
      }
    } catch (err: any) {
      console.error('Failed to join public group:', err);
      setJoinError(err.message || 'Failed to join group.');
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleJoinInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');

    if (!inviteInput.trim()) return;

    let token = inviteInput.trim();
    if (token.includes('/invites/')) {
      const parts = token.split('/invites/')[1].split('/')[0];
      if (parts) token = parts;
    }

    try {
      const res = await api.memberships.joinByInvite(token);
      if (res.success) {
        setShowInviteModal(false);
        setInviteInput('');
        setViewTab('my');
        fetchGroups();
      } else {
        setInviteError(res.error?.message || 'Failed to join group with invite token.');
      }
    } catch (err: any) {
      setInviteError(err.message || 'Failed to join group with invite token.');
    }
  };

  const activeGroupList = viewTab === 'public' ? publicGroups : myGroups;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {viewTab === 'public' ? 'Top Public Study Groups' : 'My Study Groups'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {viewTab === 'public'
              ? 'Explore open study groups across courses and subjects'
              : 'Study groups you are currently a member of'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${viewTab === 'public' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewTab('public')}
            title="Browse top public groups"
          >
            🌐 Top Public Groups
          </button>

          {myGroups.length > 0 && (
            <button
              className={`btn ${viewTab === 'my' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewTab('my')}
            >
              📚 My Groups ({myGroups.length})
            </button>
          )}

          <button className="btn btn-secondary" onClick={() => setShowInviteModal(true)}>
            🔗 Join via Invite Link
          </button>

          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create New Group
          </button>
        </div>
      </div>

      {/* In-App Error Notification Banner */}
      {joinError && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            background: 'var(--accent-rose-bg, rgba(225, 29, 72, 0.1))',
            border: '1px solid var(--accent-rose, #e11d48)',
            color: 'var(--accent-rose, #e11d48)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚠️</span>
            <span>{joinError}</span>
          </div>
          <button
            onClick={() => setJoinError('')}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              lineHeight: 1,
            }}
            title="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Zero Groups Info Notice (No Duplicated Action Buttons) */}
      {myGroups.length === 0 && !loading && (
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            background: 'var(--card-hover-bg, rgba(99, 102, 241, 0.05))',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, marginBottom: '0.25rem' }}>
            You haven&apos;t joined any study groups yet
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Showing top public study groups by default. Join a public group below or use the buttons above to create your own!
          </p>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
        <input
          type="text"
          className="form-control"
          placeholder={viewTab === 'public' ? 'Search top public groups...' : 'Search your groups...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Group Cards Grid */}
      {loading ? (
        <p>Loading study groups...</p>
      ) : activeGroupList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', maxWidth: '600px', margin: '2rem auto' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {viewTab === 'public' ? 'No public study groups found' : "You haven't joined any study groups yet"}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>
            {viewTab === 'public'
              ? 'Be the first to create a public study group for your course or major!'
              : 'Create a new group for your course or paste an invite link from a classmate to start collaborating!'}
          </p>
        </div>
      ) : (
        <div className="cards-grid">
          {activeGroupList.map((group) => {
            const isMember = group.is_member || myGroups.some((g) => g.id === group.id);

            return (
              <div key={group.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Link
                    href={`/groups/${group.id}`}
                    className="card-title"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {group.title}
                  </Link>

                  <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                    {group.is_public !== false ? (
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        🌐 Public
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' }}>
                        🔒 Private
                      </span>
                    )}

                    {isMember && <span className="badge badge-emerald">Joined</span>}
                  </div>
                </div>

                <p className="card-description">{group.description || 'No description provided.'}</p>

                <div className="card-meta">
                  <span>Created by {group.creator_name}</span>
                  <span style={{ fontWeight: 600 }}>
                    {group.member_count} {group.member_count === 1 ? 'Member' : 'Members'}
                  </span>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  {isMember ? (
                    <Link href={`/groups/${group.id}`} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                      Open Group Workspace
                    </Link>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                      disabled={joiningGroupId === group.id}
                      onClick={() => handleJoinPublicGroup(group.id)}
                    >
                      {joiningGroupId === group.id ? 'Joining...' : '+ Join Group'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal with Visibility Selector */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Create Study Group</h2>

            {createError && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: 'var(--accent-rose-bg)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              >
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label htmlFor="groupTitle">Course Title</label>
                <input
                  type="text"
                  id="groupTitle"
                  className="form-control"
                  placeholder="e.g. CS 106B Programming Abstractions"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="groupDesc">Group Description</label>
                <textarea
                  id="groupDesc"
                  className="form-control"
                  rows={3}
                  placeholder="Brief summary of study topics, meeting goals, or target exams..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              {/* Group Visibility Preference Buttons */}
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Group Visibility Preference
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className={`btn ${isPublic ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setIsPublic(true)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.75rem 0.5rem',
                      textAlign: 'center',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>🌐 Public</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.2rem' }}>
                      Anyone can discover and join
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`btn ${!isPublic ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setIsPublic(false)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.75rem 0.5rem',
                      textAlign: 'center',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>🔒 Private</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.2rem' }}>
                      Requires invite link to join
                    </span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join via Invite Link Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Join Study Group via Invite</h2>

            {inviteError && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: 'var(--accent-rose-bg)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              >
                {inviteError}
              </div>
            )}

            <form onSubmit={handleJoinInvite}>
              <div className="form-group">
                <label htmlFor="inviteToken">Invite Link or Token</label>
                <input
                  type="text"
                  id="inviteToken"
                  className="form-control"
                  placeholder="Paste invite link or token string..."
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Join Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
