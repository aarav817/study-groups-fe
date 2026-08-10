'use client';

import React, { useState, useEffect, useRef, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface GroupDetails {
  id: string;
  title: string;
  description?: string | null;
  is_public: boolean;
  created_by?: string;
  creator_name?: string;
  creator_email?: string;
  member_count?: number;
  user_membership?: { role: string } | null;
}

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  joined_at: string;
  avatar_url?: string | null;
}

interface EventItem {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_time: string;
  end_time?: string | null;
  creator_name?: string;
  created_by?: string;
  attendee_count?: number;
  is_attending?: boolean;
}

interface GroupConversation {
  id: string;
  group_id: string;
  title: string;
  created_by: string;
  created_at: string;
  creator_name?: string;
  message_count?: number;
}

interface Message {
  id: string;
  conversation_id?: string | null;
  sender_id: string;
  sender_name?: string;
  content: string;
  created_at: string;
}

interface MaterialFolder {
  id: string;
  name: string;
}

interface Material {
  id: string;
  title: string;
  file_format: string;
  file_size_bytes: number | string;
  file_url: string;
  uploader_name?: string;
  folder_id?: string | null;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  member: Member | null;
}

export default function SingleGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;
  const router = useRouter();
  const { user } = useAuth();

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [conversations, setConversations] = useState<GroupConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [folders, setFolders] = useState<MaterialFolder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'events' | 'materials' | 'members'>('chat');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const [newMsg, setNewMsg] = useState<string>('');
  const [inviteUrl, setInviteUrl] = useState<string>('');
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);

  // Modals
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventDesc, setEventDesc] = useState<string>('');
  const [eventLocation, setEventLocation] = useState<string>('');
  const [eventStartTime, setEventStartTime] = useState<string>('');
  const [eventError, setEventError] = useState<string>('');
  const [creatingEvent, setCreatingEvent] = useState<boolean>(false);

  // Topic Conversation Modal
  const [showTopicModal, setShowTopicModal] = useState<boolean>(false);
  const [topicTitle, setTopicTitle] = useState<string>('');
  const [topicError, setTopicError] = useState<string>('');
  const [creatingTopic, setCreatingTopic] = useState<boolean>(false);

  const [showMaterialModal, setShowMaterialModal] = useState<boolean>(false);
  const [matTitle, setMatTitle] = useState<string>('');
  const [matFormat, setMatFormat] = useState<string>('pdf');
  const [matUrl, setMatUrl] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(500 * 1024);
  const [matFolderId, setMatFolderId] = useState<string>('');
  const [matError, setMatError] = useState<string>('');
  const [uploadingMat, setUploadingMat] = useState<boolean>(false);

  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>('');
  const [folderError, setFolderError] = useState<string>('');

  // Group Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsTitle, setSettingsTitle] = useState<string>('');
  const [settingsDesc, setSettingsDesc] = useState<string>('');
  const [settingsPublic, setSettingsPublic] = useState<boolean>(true);
  const [settingsError, setSettingsError] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Delete Confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deletingGroup, setDeletingGroup] = useState<boolean>(false);

  // Kick Confirmation
  const [kickTarget, setKickTarget] = useState<Member | null>(null);
  const [kickingMember, setKickingMember] = useState<boolean>(false);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, member: null });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Role helpers
  const myRole = group?.user_membership?.role || null;
  const isOwner = myRole === 'owner';
  const isAdmin = myRole === 'admin';
  const isOwnerOrAdmin = isOwner || isAdmin;

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const groupRes = await api.groups.getDetails(groupId);
      if (groupRes.success && groupRes.data?.group) {
        setGroup(groupRes.data.group);
      }

      const [mRes, eRes, convRes, matRes] = await Promise.allSettled([
        api.memberships.listMembers(groupId),
        api.events.listByGroup(groupId),
        api.messages.getConversations(groupId),
        api.materials.listByGroup(groupId),
      ]);

      if (mRes.status === 'fulfilled' && mRes.value?.success) setMembers(mRes.value.data?.members || []);
      if (eRes.status === 'fulfilled' && eRes.value?.success) setEvents(eRes.value.data?.events || []);
      
      if (convRes.status === 'fulfilled' && convRes.value?.success) {
        const convs = convRes.value.data?.conversations || [];
        setConversations(convs);
        if (convs.length > 0 && !activeConvId) {
          const defaultConv = convs.find((c: GroupConversation) => c.title === 'General') || convs[0];
          setActiveConvId(defaultConv.id);
          fetchMessagesForConversation(defaultConv.id);
        } else if (activeConvId) {
          fetchMessagesForConversation(activeConvId);
        }
      }

      if (matRes.status === 'fulfilled' && matRes.value?.success) {
        setMaterials(matRes.value.data?.materials || []);
        setFolders(matRes.value.data?.folders || []);
      }
    } catch (err) {
      console.error('Failed to load group details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessagesForConversation = async (convId: string) => {
    try {
      const msgRes = await api.messages.getGroupMessages(groupId, convId);
      if (msgRes.success) {
        setMessages(msgRes.data?.messages || []);
      }
    } catch (err) {
      console.error('Failed to load messages for conversation:', err);
    }
  };

  const switchConversation = (convId: string) => {
    setActiveConvId(convId);
    fetchMessagesForConversation(convId);
  };

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  // Close context menu on click outside
  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, member: null });
  }, []);

  useEffect(() => {
    if (contextMenu.visible) {
      const handler = (e: MouseEvent) => {
        if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
          closeContextMenu();
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [contextMenu.visible, closeContextMenu]);

  // --- Handlers ---

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    try {
      const res = await api.messages.sendGroupMessage(groupId, {
        content: newMsg.trim(),
        conversation_id: activeConvId || undefined,
      });
      if (res.success && res.data?.message) {
        setMessages((prev) => [...prev, res.data.message]);
        setNewMsg('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopicError('');

    if (!topicTitle.trim()) {
      setTopicError('Topic title cannot be empty.');
      return;
    }

    try {
      setCreatingTopic(true);
      const res = await api.messages.createConversation(groupId, { title: topicTitle.trim() });
      if (res.success && res.data?.conversation) {
        const newConv = res.data.conversation;
        setShowTopicModal(false);
        setTopicTitle('');
        setConversations((prev) => [...prev, newConv]);
        switchConversation(newConv.id);
      } else {
        setTopicError(res.error?.message || 'Failed to create topic.');
      }
    } catch (err: any) {
      setTopicError(err.message || 'Failed to create topic.');
    } finally {
      setCreatingTopic(false);
    }
  };

  const handleDeleteConversation = async (convId: string, convTitle: string) => {
    if (convTitle === 'General') return;
    try {
      const res = await api.messages.deleteConversation(groupId, convId);
      if (res.success) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (activeConvId === convId) {
          const remaining = conversations.filter((c) => c.id !== convId);
          const defaultConv = remaining.find((c) => c.title === 'General') || remaining[0];
          if (defaultConv) switchConversation(defaultConv.id);
        }
      }
    } catch (err: any) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventError('');

    if (!eventTitle.trim() || !eventStartTime) {
      setEventError('Title and start time are required.');
      return;
    }

    try {
      setCreatingEvent(true);
      const res = await api.events.create(groupId, {
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        location: eventLocation.trim(),
        start_time: eventStartTime,
      });

      if (res.success) {
        setShowEventModal(false);
        setEventTitle('');
        setEventDesc('');
        setEventLocation('');
        setEventStartTime('');
        loadGroupData();
      } else {
        setEventError(res.error?.message || 'Failed to schedule event.');
      }
    } catch (err: any) {
      setEventError(err.message || 'Failed to schedule event.');
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await api.events.delete(groupId, eventId);
      if (res.success) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
      }
    } catch (err: any) {
      console.error('Failed to delete event:', err);
    }
  };

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

    if (!matTitle.trim() || (!matUrl && !selectedFileName)) {
      setMatError('Please choose a file to upload and enter a title.');
      return;
    }

    try {
      setUploadingMat(true);
      const res = await api.materials.upload(groupId, {
        title: matTitle.trim(),
        file_format: matFormat,
        file_url: matUrl || `https://storage.example.com/${selectedFileName}`,
        folder_id: matFolderId || selectedFolderId || undefined,
        file_size_bytes: fileSizeBytes,
      });

      if (res.success) {
        setShowMaterialModal(false);
        setMatTitle('');
        setMatUrl('');
        setSelectedFileName('');
        setMatFolderId('');
        loadGroupData();
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

    if (!folderName.trim()) return;

    try {
      const res = await api.materials.createFolder(groupId, { name: folderName.trim() });
      if (res.success) {
        setShowFolderModal(false);
        setFolderName('');
        loadGroupData();
      } else {
        setFolderError(res.error?.message || 'Failed to create folder.');
      }
    } catch (err: any) {
      setFolderError(err.message || 'Failed to create folder.');
    }
  };

  const handleRsvp = async (eventId: string) => {
    try {
      const res = await api.events.rsvp(eventId);
      if (res.success) {
        setEvents((prev) =>
          prev.map((ev) => (ev.id === eventId ? { ...ev, is_attending: res.data?.is_attending } : ev))
        );
      }
    } catch (err) {
      console.error('Failed to RSVP:', err);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const res = await api.memberships.createInvite(groupId);
      if (res.success && res.data?.invite?.invite_url) {
        setInviteUrl(res.data.invite.invite_url);
      }
    } catch (err) {
      console.error('Failed to generate invite:', err);
    }
  };

  const copyInvite = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  // --- Admin Actions ---

  const openSettingsModal = () => {
    if (!group) return;
    setSettingsTitle(group.title);
    setSettingsDesc(group.description || '');
    setSettingsPublic(group.is_public);
    setSettingsError('');
    setShowSettingsModal(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');

    if (!settingsTitle.trim()) {
      setSettingsError('Group title cannot be empty.');
      return;
    }

    try {
      setSavingSettings(true);
      const res = await api.groups.update(groupId, {
        title: settingsTitle.trim(),
        description: settingsDesc.trim() || undefined,
        is_public: settingsPublic,
      });

      if (res.success) {
        setShowSettingsModal(false);
        loadGroupData();
      } else {
        setSettingsError(res.error?.message || 'Failed to update group.');
      }
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to update group.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      setDeletingGroup(true);
      const res = await api.groups.delete(groupId);
      if (res.success) {
        router.push('/groups');
      }
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to delete group.');
    } finally {
      setDeletingGroup(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRoleChange = async (member: Member, newRole: 'admin' | 'member') => {
    try {
      const res = await api.memberships.updateRole(groupId, member.user_id, newRole);
      if (res.success) {
        loadGroupData();
      }
    } catch (err: any) {
      console.error('Failed to update role:', err);
    }
    closeContextMenu();
  };

  const handleKickMember = async () => {
    if (!kickTarget) return;
    try {
      setKickingMember(true);
      const res = await api.memberships.leaveGroup(groupId, kickTarget.user_id);
      if (res.success) {
        loadGroupData();
      }
    } catch (err: any) {
      console.error('Failed to kick member:', err);
    } finally {
      setKickingMember(false);
      setKickTarget(null);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      const res = await api.materials.delete(groupId, materialId);
      if (res.success) {
        setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      }
    } catch (err: any) {
      console.error('Failed to delete material:', err);
    }
  };

  const handleMemberContextMenu = (e: React.MouseEvent, member: Member) => {
    if (!isOwner || member.user_id === user?.id || member.role === 'owner') return;
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, member });
  };

  const canKick = (member: Member): boolean => {
    if (member.user_id === user?.id) return false;
    if (member.role === 'owner') return false;
    if (isOwner) return true;
    if (isAdmin && member.role === 'member') return true;
    return false;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading group workspace...</div>;
  }

  if (!group) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Study group not found or access denied.</div>;
  }

  const activeFolderName = folders.find((f) => f.id === selectedFolderId)?.name;
  const filteredMaterials = selectedFolderId
    ? materials.filter((m) => m.folder_id === selectedFolderId)
    : materials;

  return (
    <div>
      {/* Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className={`badge ${group.is_public ? 'badge-purple' : 'badge-amber'}`} style={{ marginBottom: '0.5rem' }}>
              {group.is_public ? '🌐 Public Group' : '🔒 Private Group'}
            </span>
            <h1 className="page-title" style={{ margin: '0.25rem 0' }}>{group.title}</h1>
            {group.description && <p style={{ color: 'var(--text-muted)' }}>{group.description}</p>}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isOwnerOrAdmin && (
              <button onClick={openSettingsModal} className="btn btn-secondary btn-sm" id="group-settings-btn">
                ⚙ Settings
              </button>
            )}
            <button onClick={handleGenerateInvite} className="btn btn-secondary btn-sm">
              🔗 Generate Invite Link
            </button>
          </div>
        </div>

        {inviteUrl && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-color)' }}>Invite Link: <strong>{inviteUrl}</strong></span>
            <button onClick={copyInvite} className="btn btn-primary btn-sm">
              {copiedInvite ? 'Copied! ✓' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Workspace Tabs & Single Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setActiveTab('chat')} className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}>
            💬 Group Chat ({conversations.length} Topics)
          </button>
          <button onClick={() => setActiveTab('events')} className={`btn ${activeTab === 'events' ? 'btn-primary' : 'btn-secondary'}`}>
            📅 Events ({events.length})
          </button>
          <button onClick={() => setActiveTab('materials')} className={`btn ${activeTab === 'materials' ? 'btn-primary' : 'btn-secondary'}`}>
            📁 Materials ({materials.length})
          </button>
          <button onClick={() => setActiveTab('members')} className={`btn ${activeTab === 'members' ? 'btn-primary' : 'btn-secondary'}`}>
            👥 Members ({members.length})
          </button>
        </div>

        {/* Action Buttons Toolbar */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab === 'chat' && (
            <button onClick={() => setShowTopicModal(true)} className="btn btn-primary btn-sm">
              + New Topic
            </button>
          )}
          {activeTab === 'events' && (
            <button onClick={() => setShowEventModal(true)} className="btn btn-primary btn-sm">
              + Schedule Event
            </button>
          )}
          {activeTab === 'materials' && (
            <>
              <button onClick={() => setShowFolderModal(true)} className="btn btn-secondary btn-sm">
                📁 + Create Folder
              </button>
              <button onClick={() => setShowMaterialModal(true)} className="btn btn-primary btn-sm">
                + Upload Material
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="card">
        {/* MULTI-CONVERSATION GROUP CHAT STREAM */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '480px' }}>
            {/* Scrollable Conversation Topic Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              {conversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                const isGeneral = conv.title === 'General';
                return (
                  <div
                    key={conv.id}
                    onClick={() => switchConversation(conv.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '16px',
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 600 : 400,
                      backgroundColor: isActive ? 'var(--primary-light)' : 'var(--panel-bg)',
                      color: isActive ? 'var(--primary-color)' : 'var(--text-color)',
                      border: `1px solid ${isActive ? 'var(--primary-color)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      flexShrink: 0,
                    }}
                  >
                    <span>💬 {conv.title}</span>
                    {isOwnerOrAdmin && !isGeneral && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id, conv.title);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-rose)', fontSize: '0.75rem', padding: '0 2px' }}
                        title="Delete topic"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => setShowTopicModal(true)}
                style={{ padding: '0.35rem 0.65rem', borderRadius: '16px', fontSize: '0.8rem', backgroundColor: 'var(--panel-bg)', border: '1px dashed var(--primary-color)', color: 'var(--primary-color)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                + Topic
              </button>
            </div>

            {/* Chat Stream */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem', paddingRight: '0.5rem' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: 'auto' }}>
                  No messages in this topic yet. Start the conversation!
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} style={{ padding: '0.35rem 0.65rem', backgroundColor: 'var(--panel-bg)', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary-color)', flexShrink: 0 }}>{m.sender_name || 'Member'}:</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-color)' }}>{m.content}</span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder={`Post to #${conversations.find((c) => c.id === activeConvId)?.title || 'chat'}...`}
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Send
              </button>
            </form>
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Group Members ({members.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {members.map((m) => (
                <div
                  key={m.id}
                  onContextMenu={(e) => handleMemberContextMenu(e, m)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', backgroundColor: 'var(--panel-bg)', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: isOwner && m.user_id !== user?.id && m.role !== 'owner' ? 'context-menu' : 'default' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.email}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge ${m.role === 'owner' ? 'badge-purple' : m.role === 'admin' ? 'badge-amber' : 'badge-emerald'}`}>{m.role.toUpperCase()}</span>
                    {canKick(m) && (
                      <button
                        onClick={() => setKickTarget(m)}
                        className="icon-btn danger"
                        title="Remove member"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {isOwner && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.75rem' }}>
                💡 Right-click a member to promote or demote them.
              </p>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Upcoming Events & Study Sessions</h3>
            </div>

            {events.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No events scheduled yet for this group. Use the button above to schedule one!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {events.map((e) => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', backgroundColor: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '1rem' }}>{e.title}</h4>
                      {e.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>{e.description}</p>}
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        <span>📅 {new Date(e.start_time).toLocaleString()}</span>
                        {e.location && <span>📍 {e.location}</span>}
                        <span>👥 {e.attendee_count || 1} Attending</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleRsvp(e.id)}
                        className={`btn ${e.is_attending ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                      >
                        {e.is_attending ? '✓ Attending' : 'RSVP'}
                      </button>

                      {(isOwnerOrAdmin || e.created_by === user?.id) && (
                        <button
                          onClick={() => handleDeleteEvent(e.id)}
                          className="icon-btn danger"
                          title="Delete event"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INTERACTIVE FOLDER DIRECTORY HIERARCHY */}
        {activeTab === 'materials' && (
          <div>
            {/* Folder Crumb Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className={`btn ${selectedFolderId === null ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                >
                  📁 All Files ({materials.length})
                </button>
                {selectedFolderId && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    / 📁 {activeFolderName}
                  </span>
                )}
              </div>

              {selectedFolderId && (
                <button onClick={() => setSelectedFolderId(null)} className="btn btn-secondary btn-sm">
                  &larr; Back to All Folders
                </button>
              )}
            </div>

            {/* Folder Directory Grid */}
            {!selectedFolderId && folders.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Folders ({folders.length})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.875rem' }}>
                  {folders.map((folder) => {
                    const count = materials.filter((m) => m.folder_id === folder.id).length;

                    return (
                      <div
                        key={folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        style={{
                          padding: '0.875rem 1rem',
                          backgroundColor: 'var(--panel-bg)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-color)')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                      >
                        <div style={{ fontSize: '1.5rem' }}>📁</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-color)' }}>{folder.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{count} {count === 1 ? 'file' : 'files'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Material Items List */}
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              {selectedFolderId ? `Files in "${activeFolderName}" (${filteredMaterials.length})` : `All Group Files (${materials.length})`}
            </h4>

            {filteredMaterials.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {selectedFolderId ? 'No materials in this folder yet. Use "+ Upload Material" above to add files!' : 'No materials uploaded in this group yet.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {filteredMaterials.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', backgroundColor: 'var(--panel-bg)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.title}</div>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{m.file_format.toUpperCase()} • Uploaded by {m.uploader_name || 'Member'}</small>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                        View Material &rarr;
                      </a>
                      {isOwnerOrAdmin && (
                        <button
                          onClick={() => handleDeleteMaterial(m.id)}
                          className="icon-btn danger"
                          title="Delete material"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context Menu (right-click on member) */}
      {contextMenu.visible && contextMenu.member && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div style={{ padding: '0.375rem 0.875rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase' }}>
            {contextMenu.member.full_name}
          </div>
          <div className="context-menu-divider" />

          {contextMenu.member.role === 'member' ? (
            <button className="context-menu-item" onClick={() => handleRoleChange(contextMenu.member!, 'admin')}>
              ⬆️ Promote to Admin
            </button>
          ) : contextMenu.member.role === 'admin' ? (
            <button className="context-menu-item" onClick={() => handleRoleChange(contextMenu.member!, 'member')}>
              ⬇️ Demote to Member
            </button>
          ) : null}

          <div className="context-menu-divider" />
          <button
            className="context-menu-item danger"
            onClick={() => {
              setKickTarget(contextMenu.member);
              closeContextMenu();
            }}
          >
            ✕ Remove from Group
          </button>
        </div>
      )}

      {/* Kick Member Confirmation */}
      {kickTarget && (
        <div className="confirm-overlay" onClick={() => !kickingMember && setKickTarget(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Remove Member</h3>
            <p>
              Are you sure you want to remove <strong>{kickTarget.full_name}</strong> ({kickTarget.email}) from this group? They can rejoin later via invite.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setKickTarget(null)} disabled={kickingMember}>Cancel</button>
              <button className="btn btn-danger" onClick={handleKickMember} disabled={kickingMember}>
                {kickingMember ? 'Removing...' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>Group Settings</h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {isOwner ? 'Manage group details, visibility, and danger zone.' : 'Edit group name and description.'}
            </p>

            {settingsError && <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--accent-rose-bg)', color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '1rem' }}>{settingsError}</div>}

            <form onSubmit={handleSaveSettings}>
              {/* General Settings */}
              <div className="settings-section">
                <div className="settings-section-title">General</div>
                <div className="form-group">
                  <label>Group Name</label>
                  <input type="text" className="form-control" value={settingsTitle} onChange={(e) => setSettingsTitle(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Description</label>
                  <textarea rows={3} className="form-control" value={settingsDesc} onChange={(e) => setSettingsDesc(e.target.value)} placeholder="Describe this study group..." />
                </div>
              </div>

              {/* Visibility */}
              <div className="settings-section">
                <div className="settings-section-title">Visibility</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setSettingsPublic(true)}
                    className={`btn ${settingsPublic ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  >
                    🌐 Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsPublic(false)}
                    className={`btn ${!settingsPublic ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  >
                    🔒 Private
                  </button>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    {settingsPublic ? 'Anyone can discover and join this group.' : 'Only members with an invite link can join.'}
                  </span>
                </div>
              </div>

              {/* Danger Zone - Owner Only */}
              {isOwner && (
                <div className="settings-section">
                  <div className="settings-section-title" style={{ color: 'var(--accent-rose)' }}>⚠ Danger Zone</div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Permanently delete this group and all associated data (messages, events, materials, memberships). This action cannot be undone.
                  </p>
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    🗑 Delete Group Permanently
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                  {savingSettings ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Topic Modal */}
      {showTopicModal && (
        <div className="modal-overlay" onClick={() => setShowTopicModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Start New Chat Topic</h2>
            {topicError && <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--accent-rose-bg)', color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '1rem' }}>{topicError}</div>}
            <form onSubmit={handleCreateTopic}>
              <div className="form-group">
                <label>Topic Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Homework Help, Midterm Review, Office Hours"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTopicModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingTopic}>{creatingTopic ? 'Creating...' : 'Create Topic'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation */}
      {showDeleteConfirm && (
        <div className="confirm-overlay" onClick={() => !deletingGroup && setShowDeleteConfirm(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>🗑 Delete &quot;{group.title}&quot;?</h3>
            <p>
              This will permanently delete the group and all its data including messages, events, materials, and memberships. This action <strong>cannot be undone</strong>.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deletingGroup}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteGroup} disabled={deletingGroup}>
                {deletingGroup ? 'Deleting...' : 'Yes, Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Schedule Study Event</h2>
            {eventError && <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--accent-rose-bg)', color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '1rem' }}>{eventError}</div>}
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Event Title</label>
                <input type="text" className="form-control" placeholder="e.g. Midterm Review Session" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} className="form-control" placeholder="Topics covered, problem sets..." value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Location / Zoom Link</label>
                <input type="text" className="form-control" placeholder="e.g. Library Room 204 or Zoom Link" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Start Date & Time</label>
                <input type="datetime-local" className="form-control" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEventModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingEvent}>{creatingEvent ? 'Scheduling...' : 'Schedule Event'}</button>
              </div>
            </form>
          </div>
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
                <label>Folder Name</label>
                <input type="text" className="form-control" placeholder="e.g. Lecture Notes, Past Exams" value={folderName} onChange={(e) => setFolderName(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFolderModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Folder</button>
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
              {/* File Upload Box */}
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
                <input type="text" className="form-control" placeholder="e.g. Lecture 5 Notes or Midterm 2 Solution Key" value={matTitle} onChange={(e) => setMatTitle(e.target.value)} required />
              </div>
              {folders.length > 0 && (
                <div className="form-group">
                  <label>Folder (Optional)</label>
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
