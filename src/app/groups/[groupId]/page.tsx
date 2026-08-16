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
  sender_avatar?: string | null;
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

  // Group Capacity & Permissions
  const [maxMembersCap, setMaxMembersCap] = useState<string>('');
  const [allowMemberUpload, setAllowMemberUpload] = useState<boolean>(true);
  const [allowMemberChat, setAllowMemberChat] = useState<boolean>(true);
  const [allowMemberEvents, setAllowMemberEvents] = useState<boolean>(true);
  const [allowMemberInvites, setAllowMemberInvites] = useState<boolean>(true);

  // Leave Confirmation
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);
  const [leavingGroup, setLeavingGroup] = useState<boolean>(false);

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

  // Permission helpers
  const canUpload = isOwnerOrAdmin || allowMemberUpload;
  const canChat = isOwnerOrAdmin || allowMemberChat;
  const canCreateEvents = isOwnerOrAdmin || allowMemberEvents;
  const canGenerateInvites = isOwnerOrAdmin || allowMemberInvites;

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
    if (typeof window !== 'undefined') {
      const savedCap = localStorage.getItem(`group_cap_${groupId}`);
      if (savedCap) setMaxMembersCap(savedCap);

      const savedPerms = localStorage.getItem(`group_permissions_${groupId}`);
      if (savedPerms) {
        try {
          const parsed = JSON.parse(savedPerms);
          if (typeof parsed.allowMemberUpload === 'boolean') setAllowMemberUpload(parsed.allowMemberUpload);
          if (typeof parsed.allowMemberChat === 'boolean') setAllowMemberChat(parsed.allowMemberChat);
          if (typeof parsed.allowMemberEvents === 'boolean') setAllowMemberEvents(parsed.allowMemberEvents);
          if (typeof parsed.allowMemberInvites === 'boolean') setAllowMemberInvites(parsed.allowMemberInvites);
        } catch (e) { }
      }
    }
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

  // Handlers
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

  // Admin Actions
  const openSettingsModal = () => {
    if (!group) return;
    setSettingsTitle(group.title);
    setSettingsDesc(group.description || '');
    setSettingsPublic(group.is_public);
    setSettingsError('');
    setShowSettingsModal(true);
  };

  const handleLeaveGroup = async () => {
    if (!user) return;
    try {
      setLeavingGroup(true);
      const res = await api.memberships.leaveGroup(groupId, user.id);
      if (res.success) {
        router.push('/groups');
      } else {
        alert(res.error?.message || 'Failed to leave group.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to leave group.');
    } finally {
      setLeavingGroup(false);
      setShowLeaveConfirm(false);
    }
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
        if (typeof window !== 'undefined') {
          if (maxMembersCap.trim()) {
            localStorage.setItem(`group_cap_${groupId}`, maxMembersCap.trim());
          } else {
            localStorage.removeItem(`group_cap_${groupId}`);
          }
          localStorage.setItem(
            `group_permissions_${groupId}`,
            JSON.stringify({
              allowMemberUpload,
              allowMemberChat,
              allowMemberEvents,
              allowMemberInvites,
            })
          );
        }
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
      console.error('Failed to remove member:', err);
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
    return <div style={{ padding: '2rem 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Loading group workspace...</div>;
  }

  if (!group) {
    return <div style={{ padding: '2rem 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Study group not found or access denied.</div>;
  }

  const activeFolderName = folders.find((f) => f.id === selectedFolderId)?.name;
  const filteredMaterials = selectedFolderId
    ? materials.filter((m) => m.folder_id === selectedFolderId)
    : materials;

  return (
    <div>
      {/* Workspace Header Card */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{group.title}</h1>
            {group.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.4 }}>{group.description}</p>}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, alignItems: 'center' }}>
            {myRole && !isOwner && (
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--accent-rose)' }}
                title="Leave study group"
              >
                Leave Group
              </button>
            )}
            {isOwnerOrAdmin && (
              <button onClick={openSettingsModal} className="btn btn-secondary btn-sm" id="group-settings-btn">
                Settings
              </button>
            )}
            {canGenerateInvites && (
              <button onClick={handleGenerateInvite} className="btn btn-secondary btn-sm">
                Generate Invite Link
              </button>
            )}
          </div>
        </div>

        {inviteUrl && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78125rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>Invite: <strong>{inviteUrl}</strong></span>
            <button onClick={copyInvite} className="btn btn-navy btn-xs">
              {copiedInvite ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Segmented Control Workspace Tabs & Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="segmented-control">
          <button
            onClick={() => setActiveTab('chat')}
            className={`segmented-item ${activeTab === 'chat' ? 'active' : ''}`}
          >
            Chat ({conversations.length} Topics)
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`segmented-item ${activeTab === 'events' ? 'active' : ''}`}
          >
            Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`segmented-item ${activeTab === 'materials' ? 'active' : ''}`}
          >
            Materials ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`segmented-item ${activeTab === 'members' ? 'active' : ''}`}
          >
            Members ({members.length})
          </button>
        </div>

        {/* Action Buttons Toolbar */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {activeTab === 'chat' && canChat && (
            <button onClick={() => setShowTopicModal(true)} className="btn btn-navy btn-sm">
              + New Topic
            </button>
          )}
          {activeTab === 'events' && canCreateEvents && (
            <button onClick={() => setShowEventModal(true)} className="btn btn-navy btn-sm">
              + Schedule Event
            </button>
          )}
          {activeTab === 'materials' && canUpload && (
            <>
              <button onClick={() => setShowFolderModal(true)} className="btn btn-secondary btn-sm">
                + New Folder
              </button>
              <button onClick={() => setShowMaterialModal(true)} className="btn btn-navy btn-sm">
                + Upload File
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Workspace Content Card */}
      <div className="card" style={{ padding: '1rem' }}>
        {/* GROUP CHAT STREAM */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '450px' }}>
            {/* Topic Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              {conversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                const isGeneral = conv.title === 'General';
                return (
                  <div
                    key={conv.id}
                    onClick={() => switchConversation(conv.id)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: isActive ? 600 : 500,
                      backgroundColor: isActive ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                      color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                      border: `1px solid ${isActive ? 'var(--primary-light)' : 'var(--border-default)'}`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      flexShrink: 0,
                    }}
                  >
                    <span>#{conv.title}</span>
                    {isOwnerOrAdmin && !isGeneral && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id, conv.title);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-rose)', fontSize: '0.75rem', padding: '0 2px' }}
                        title="Delete topic"
                      >
                        x
                      </button>
                    )}
                  </div>
                );
              })}

              {canChat && (
                <button
                  onClick={() => setShowTopicModal(true)}
                  style={{ padding: '0.25rem 0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', backgroundColor: 'transparent', border: '1px dashed var(--border-strong)', color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  + Topic
                </button>
              )}
            </div>

            {/* Bubble Chat Messages */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.65rem', paddingRight: '0.25rem' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 'auto' }}>
                  No messages in this topic yet.
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  const senderMember = members.find((mem) => mem.user_id === m.sender_id);
                  const avatarUrl = m.sender_avatar || senderMember?.avatar_url;
                  const senderName = m.sender_name || senderMember?.full_name || 'Member';

                  return (
                    <div key={m.id} className={`chat-bubble-row ${isMe ? 'me' : 'other'}`}>
                      <Link href={`/users/${m.sender_id}`} title={senderName} style={{ flexShrink: 0, textDecoration: 'none' }}>
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={senderName}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid var(--border-default)',
                            }}
                          />
                        ) : (
                          <div
                            className="avatar-circle"
                            style={{
                              width: '26px',
                              height: '26px',
                              fontSize: '0.6875rem',
                              backgroundColor: isMe ? 'var(--primary-subtle)' : 'var(--bg-subtle)',
                              color: isMe ? 'var(--primary-color)' : 'var(--primary-navy)',
                            }}
                          >
                            {senderName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Link>

                      <div className={`chat-bubble ${isMe ? 'me' : 'other'}`}>
                        <div className="chat-bubble-header">
                          <Link href={`/users/${m.sender_id}`} className="chat-bubble-sender">
                            {isMe ? 'You' : senderName}
                          </Link>
                          <span className="chat-bubble-time">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="chat-bubble-content">{m.content}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {canChat ? (
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Post to #${conversations.find((c) => c.id === activeConvId)?.title || 'general'}...`}
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  style={{ padding: '0.4rem 0.65rem', fontSize: '0.8125rem' }}
                />
                <button type="submit" className="btn btn-navy btn-sm">
                  Send
                </button>
              </form>
            ) : (
              <div style={{ padding: '0.45rem 0.75rem', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Sending chat messages is restricted to group admins.
              </div>
            )}
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Enrolled Members ({members.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {members.map((m) => (
                <div
                  key={m.id}
                  onContextMenu={(e) => handleMemberContextMenu(e, m)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    cursor: isOwner && m.user_id !== user?.id && m.role !== 'owner' ? 'context-menu' : 'default',
                  }}
                >
                  <Link
                    href={`/users/${m.user_id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      textDecoration: 'none',
                      flex: 1,
                      minWidth: 0,
                    }}
                    title="View read-only profile"
                  >
                    {m.avatar_url ? (
                      <img
                        src={m.avatar_url}
                        alt={m.full_name}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid var(--border-default)',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        className="avatar-circle"
                        style={{
                          width: '32px',
                          height: '32px',
                          fontSize: '0.8125rem',
                          flexShrink: 0,
                        }}
                      >
                        {m.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--primary-navy)' }}>
                        {m.full_name}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        Click to view profile
                      </div>
                    </div>
                  </Link>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    <span className={`badge ${m.role === 'owner' ? 'badge-navy' : m.role === 'admin' ? 'badge-amber' : 'badge-blue'}`}>
                      {m.role}
                    </span>
                    {canKick(m) && (
                      <button
                        onClick={() => setKickTarget(m)}
                        className="icon-btn danger"
                        title="Remove member"
                      >
                        x
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {isOwner && (
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.625rem' }}>
                Right-click a member to change permissions between admin and member.
              </p>
            )}
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Scheduled Study Sessions
            </div>

            {events.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '1rem 0' }}>
                No events scheduled yet. Click &quot;+ Schedule Event&quot; above to set a meeting.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {events.map((e) => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-navy)' }}>{e.title}</h4>
                      {e.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.15rem 0' }}>{e.description}</p>}
                      <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.71875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        <span>Time: {new Date(e.start_time).toLocaleString()}</span>
                        {e.location && <span>Location: {e.location}</span>}
                        <span>{e.attendee_count || 1} Attending</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleRsvp(e.id)}
                        className={`btn ${e.is_attending ? 'btn-secondary' : 'btn-navy'} btn-xs`}
                      >
                        {e.is_attending ? 'Attending' : 'RSVP'}
                      </button>

                      {(isOwnerOrAdmin || e.created_by === user?.id) && (
                        <button
                          onClick={() => handleDeleteEvent(e.id)}
                          className="icon-btn danger"
                          title="Delete event"
                        >
                          x
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div>
            {/* Folder Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className={`btn ${selectedFolderId === null ? 'btn-navy' : 'btn-secondary'} btn-xs`}
                >
                  All Files ({materials.length})
                </button>
                {selectedFolderId && (
                  <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    / {activeFolderName}
                  </span>
                )}
              </div>

              {selectedFolderId && (
                <button onClick={() => setSelectedFolderId(null)} className="btn btn-secondary btn-xs">
                  Back to All Folders
                </button>
              )}
            </div>

            {/* Folder Directory Grid */}
            {!selectedFolderId && folders.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Folders ({folders.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                  {folders.map((folder) => {
                    const count = materials.filter((m) => m.folder_id === folder.id).length;

                    return (
                      <div
                        key={folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--primary-navy)' }}>{folder.name}</div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{count} {count === 1 ? 'file' : 'files'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Files List */}
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {selectedFolderId ? `Files in ${activeFolderName} (${filteredMaterials.length})` : `All Materials (${materials.length})`}
            </div>

            {filteredMaterials.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '0.5rem 0' }}>
                {selectedFolderId ? 'No materials in this folder yet.' : 'No materials uploaded in this group yet.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {filteredMaterials.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--primary-navy)' }}>{m.title}</div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                        {m.file_format.toUpperCase()} • Uploaded by {m.uploader_name || 'Member'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-xs">
                        View File &rarr;
                      </a>
                      {isOwnerOrAdmin && (
                        <button
                          onClick={() => handleDeleteMaterial(m.id)}
                          className="icon-btn danger"
                          title="Delete material"
                        >
                          x
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

      {/* Context Menu (right-click member) */}
      {contextMenu.visible && contextMenu.member && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div style={{ padding: '0.3rem 0.65rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {contextMenu.member.full_name}
          </div>
          <div className="context-menu-divider" />

          {contextMenu.member.role === 'member' ? (
            <button className="context-menu-item" onClick={() => handleRoleChange(contextMenu.member!, 'admin')}>
              Promote to Admin
            </button>
          ) : contextMenu.member.role === 'admin' ? (
            <button className="context-menu-item" onClick={() => handleRoleChange(contextMenu.member!, 'member')}>
              Demote to Member
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
            Remove from Group
          </button>
        </div>
      )}

      {/* Kick Member Confirm Modal */}
      {kickTarget && (
        <div className="confirm-overlay" onClick={() => !kickingMember && setKickTarget(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Remove Member</h3>
            <p>
              Are you sure you want to remove <strong>{kickTarget.full_name}</strong> from this study group?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setKickTarget(null)} disabled={kickingMember}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleKickMember} disabled={kickingMember}>
                {kickingMember ? 'Removing...' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Group Confirm Modal */}
      {showLeaveConfirm && (
        <div className="confirm-overlay" onClick={() => !leavingGroup && setShowLeaveConfirm(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Leave Study Group</h3>
            <p>
              Are you sure you want to leave <strong>{group.title}</strong>? You can rejoin later if the group is public or via an invite link.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowLeaveConfirm(false)} disabled={leavingGroup}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleLeaveGroup} disabled={leavingGroup}>
                {leavingGroup ? 'Leaving...' : 'Leave Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Group Settings</h2>
            <p className="modal-subtitle">
              {isOwner ? 'Manage group title, member limits, permissions, and visibility.' : 'Edit group title and description.'}
            </p>

            {settingsError && (
              <div className="alert-banner alert-danger">
                <span>{settingsError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings}>
              <div className="settings-section">
                <div className="settings-section-title">General</div>
                <div className="form-group">
                  <label>Group Title</label>
                  <input type="text" value={settingsTitle} onChange={(e) => setSettingsTitle(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Description</label>
                  <textarea rows={2} value={settingsDesc} onChange={(e) => setSettingsDesc(e.target.value)} />
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Member Capacity</div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Maximum Members Cap</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="No limit (unlimited)"
                    value={maxMembersCap}
                    onChange={(e) => setMaxMembersCap(e.target.value)}
                  />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Leave blank for unlimited capacity.
                  </span>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Member Permissions</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Configure what regular group members are permitted to do.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78125rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowMemberUpload}
                      onChange={(e) => setAllowMemberUpload(e.target.checked)}
                    />
                    <span>Allow members to upload materials & create folders</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78125rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowMemberChat}
                      onChange={(e) => setAllowMemberChat(e.target.checked)}
                    />
                    <span>Allow members to send messages in chat topics</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78125rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowMemberEvents}
                      onChange={(e) => setAllowMemberEvents(e.target.checked)}
                    />
                    <span>Allow members to schedule study sessions & events</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78125rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowMemberInvites}
                      onChange={(e) => setAllowMemberInvites(e.target.checked)}
                    />
                    <span>Allow members to generate invite links</span>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Visibility</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setSettingsPublic(true)}
                    className={`btn ${settingsPublic ? 'btn-navy' : 'btn-secondary'} btn-xs`}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsPublic(false)}
                    className={`btn ${!settingsPublic ? 'btn-navy' : 'btn-secondary'} btn-xs`}
                  >
                    Private
                  </button>
                </div>
              </div>

              {isOwner && (
                <div className="settings-section">
                  <div className="settings-section-title" style={{ color: 'var(--accent-rose)' }}>Danger Zone</div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Permanently delete this group and all its files, events, and chats.
                  </p>
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-xs"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Group Permanently
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowSettingsModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-navy btn-sm" disabled={savingSettings}>
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
            <h2 className="modal-title">New Chat Topic</h2>
            <p className="modal-subtitle">Start a channel for specific homework, exams, or labs.</p>
            {topicError && <div className="alert-banner alert-danger"><span>{topicError}</span></div>}
            <form onSubmit={handleCreateTopic}>
              <div className="form-group">
                <label>Topic Title</label>
                <input
                  type="text"
                  placeholder="e.g. Midterm 1 Prep, Problem Set 3"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowTopicModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-navy btn-sm" disabled={creatingTopic}>{creatingTopic ? 'Creating...' : 'Create Topic'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation */}
      {showDeleteConfirm && (
        <div className="confirm-overlay" onClick={() => !deletingGroup && setShowDeleteConfirm(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Group</h3>
            <p>
              Permanently delete <strong>{group.title}</strong>? This action cannot be reversed.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDeleteConfirm(false)} disabled={deletingGroup}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteGroup} disabled={deletingGroup}>
                {deletingGroup ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Schedule Study Session</h2>
            {eventError && <div className="alert-banner alert-danger"><span>{eventError}</span></div>}
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Session Title</label>
                <input type="text" placeholder="e.g. Weekly Problem Set Working Group" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} placeholder="Topics covered, room number, or links..." value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Location / Link</label>
                <input type="text" placeholder="e.g. Science Library Room 204 or Zoom Link" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Date & Time</label>
                <input type="datetime-local" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEventModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-navy btn-sm" disabled={creatingEvent}>{creatingEvent ? 'Scheduling...' : 'Schedule'}</button>
              </div>
            </form>
          </div>
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
                <label>Folder Name</label>
                <input type="text" placeholder="e.g. Lecture Slides, Midterm Solutions" value={folderName} onChange={(e) => setFolderName(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowFolderModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-navy btn-sm">Create Folder</button>
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
                <label>Title</label>
                <input type="text" placeholder="e.g. Lecture 4 Notes" value={matTitle} onChange={(e) => setMatTitle(e.target.value)} required />
              </div>
              {folders.length > 0 && (
                <div className="form-group">
                  <label>Folder (Optional)</label>
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
