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
            {viewTab === 'public' ? 'Public Study Groups' : 'My Study Groups'}
          </h1>
          <p className="page-subtitle">
            {viewTab === 'public'
              ? 'Find public study groups across a variety of courses'
              : 'Active study groups that you are a member of'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="segmented-control">
            <button
              className={`segmented-item ${viewTab === 'public' ? 'active' : ''}`}
              onClick={() => setViewTab('public')}
            >
              Public Study Groups
            </button>
            <button
              className={`segmented-item ${viewTab === 'my' ? 'active' : ''}`}
              onClick={() => setViewTab('my')}
            >
              My Groups ({myGroups.length})
            </button>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={() => setShowInviteModal(true)}>
            Join via Invite Code
          </button>

          <button className="btn btn-navy btn-sm" onClick={() => setShowCreateModal(true)}>
            + Create Group
          </button>
        </div>
      </div>

      {/* Error notification */}
      {joinError && (
        <div className="alert-banner alert-danger">
          <span>{joinError}</span>
          <button
            onClick={() => setJoinError('')}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search Input */}
      <div style={{ marginBottom: '1rem', maxWidth: '340px' }}>
        <input
          type="text"
          className="form-control"
          placeholder={viewTab === 'public' ? 'Filter public groups by course or title...' : 'Filter your groups...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Group Cards Grid */}
      {loading ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '1rem 0' }}>Loading study groups...</p>
      ) : activeGroupList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', maxWidth: '480px', margin: '1.5rem auto' }}>
          <h2 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>
            {viewTab === 'public' ? 'No public study groups found' : 'No enrolled study groups'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.45, marginBottom: '1rem' }}>
            {viewTab === 'public'
              ? 'Be the first to create a public study group for your course or department.'
              : 'Create a group or paste an invite code from a classmate to begin.'}
          </p>
          <button className="btn btn-navy btn-sm" onClick={() => setShowCreateModal(true)}>
            Create New Study Group
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {activeGroupList.map((group) => {
            const isMember = group.is_member || myGroups.some((g) => g.id === group.id);

            return (
              <div key={group.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Link
                    href={`/groups/${group.id}`}
                    className="card-title"
                    style={{ color: 'var(--primary-navy)', textDecoration: 'none' }}
                  >
                    {group.title}
                  </Link>

                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                    {group.is_public !== false ? (
                      <span className="badge badge-blue">Public</span>
                    ) : (
                      <span className="badge badge-navy">Private</span>
                    )}

                    {isMember && <span className="badge badge-emerald">Enrolled</span>}
                  </div>
                </div>

                <p className="card-description">{group.description || 'No description provided.'}</p>

                <div className="card-meta">
                  <span>Created by {group.creator_name}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                  </span>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  {isMember ? (
                    <Link href={`/groups/${group.id}`} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                      Open Workspace
                    </Link>
                  ) : (
                    <button
                      className="btn btn-navy btn-sm"
                      style={{ width: '100%' }}
                      disabled={joiningGroupId === group.id}
                      onClick={() => handleJoinPublicGroup(group.id)}
                    >
                      {joiningGroupId === group.id ? 'Joining...' : 'Join Group'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create Study Group</h2>
            <p className="modal-subtitle">Set up a course channel for collaboration and file sharing.</p>

            {createError && (
              <div className="alert-banner alert-danger">
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label htmlFor="groupTitle">Course / Group Title</label>
                <input
                  type="text"
                  id="groupTitle"
                  placeholder="e.g. CS 106B Programming Abstractions"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="groupDesc">Description (Optional)</label>
                <textarea
                  id="groupDesc"
                  rows={3}
                  placeholder="Study topics, weekly problem sets, midterm preparation..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Visibility</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn ${isPublic ? 'btn-navy' : 'btn-secondary'}`}
                    onClick={() => setIsPublic(true)}
                    style={{ flexDirection: 'column', padding: '0.5rem', alignItems: 'flex-start' }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Public</span>
                    <span style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: '2px' }}>
                      Discoverable by all students
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`btn ${!isPublic ? 'btn-navy' : 'btn-secondary'}`}
                    onClick={() => setIsPublic(false)}
                    style={{ flexDirection: 'column', padding: '0.5rem', alignItems: 'flex-start' }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Private</span>
                    <span style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: '2px' }}>
                      Requires invite token to join
                    </span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-navy btn-sm">
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
            <h2 className="modal-title">Join Study Group via Invite</h2>
            <p className="modal-subtitle">Enter an invite link or token string provided by a group member.</p>

            {inviteError && (
              <div className="alert-banner alert-danger">
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleJoinInvite}>
              <div className="form-group">
                <label htmlFor="inviteToken">Invite Link or Token</label>
                <input
                  type="text"
                  id="inviteToken"
                  placeholder="Paste invite link or token string..."
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-navy btn-sm">
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
