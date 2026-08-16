'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface DirectChat {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_avatar?: string | null;
  partner_code: string;
}

interface PendingRequest {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string | null;
  sender_code: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

export default function DirectMessagesPage() {
  const [activeChats, setActiveChats] = useState<DirectChat[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<DirectChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState<string>('');

  const [messagingCodeInput, setMessagingCodeInput] = useState<string>('');
  const [requestMsg, setRequestMsg] = useState<string>('');
  const [requestError, setRequestError] = useState<string>('');
  const [sendingReq, setSendingReq] = useState<boolean>(false);

  const loadDirectChats = async () => {
    try {
      const res = await api.messages.getDirectChats();
      if (res.success && res.data) {
        setActiveChats(res.data.active_chats || []);
        setPendingRequests(res.data.pending_requests || []);
        if (res.data.active_chats?.length > 0 && !selectedPartner) {
          setSelectedPartner(res.data.active_chats[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load direct chats:', err);
    }
  };

  useEffect(() => {
    loadDirectChats();
  }, []);

  useEffect(() => {
    if (selectedPartner) {
      loadMessages(selectedPartner.partner_id);
    }
  }, [selectedPartner]);

  const loadMessages = async (partnerId: string) => {
    try {
      const res = await api.messages.getDirectMessages(partnerId);
      if (res.success && res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSendChatRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestMsg('');
    setRequestError('');

    if (!messagingCodeInput.trim()) return;

    try {
      setSendingReq(true);
      const res = await api.messages.sendChatRequest({ messaging_code: messagingCodeInput.trim() });
      if (res.success) {
        setRequestMsg('Direct chat request sent.');
        setMessagingCodeInput('');
        loadDirectChats();
      } else {
        setRequestError(res.error?.message || 'Failed to send chat request.');
      }
    } catch (err: any) {
      setRequestError(err.message || 'Error sending chat request.');
    } finally {
      setSendingReq(false);
    }
  };

  const handleRespond = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const res = await api.messages.respondToRequest(requestId, action);
      if (res.success) {
        loadDirectChats();
      }
    } catch (err) {
      console.error('Failed to respond to request:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !selectedPartner) return;

    try {
      const res = await api.messages.sendDirectMessage(selectedPartner.partner_id, { content: newMsg.trim() });
      if (res.success && res.data?.message) {
        setMessages((prev) => [...prev, res.data.message]);
        setNewMsg('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Direct Messages</h1>
          <p className="page-subtitle">
            1-on-1 messaging with your classmates.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1rem', minHeight: '480px' }}>
        {/* Left Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Send Chat Request Card */}
          <div className="card" style={{ padding: '0.875rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.2rem' }}>
              Request Direct Chat
            </div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Enter a classmate&apos;s 6-character user code.
            </p>
            {requestMsg && <div className="alert-banner alert-success" style={{ padding: '0.35rem 0.5rem', fontSize: '0.71875rem', marginBottom: '0.4rem' }}><span>{requestMsg}</span></div>}
            {requestError && <div className="alert-banner alert-danger" style={{ padding: '0.35rem 0.5rem', fontSize: '0.71875rem', marginBottom: '0.4rem' }}><span>{requestError}</span></div>}
            <form onSubmit={handleSendChatRequest} style={{ display: 'flex', gap: '0.35rem' }}>
              <input
                type="text"
                placeholder="Code (e.g. AB12CD)"
                value={messagingCodeInput}
                onChange={(e) => setMessagingCodeInput(e.target.value.toUpperCase())}
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.78125rem' }}
                required
              />
              <button type="submit" className="btn btn-navy btn-xs" disabled={sendingReq}>
                Request
              </button>
            </form>
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="card" style={{ padding: '0.75rem', border: '1px solid var(--accent-amber-border)', backgroundColor: 'var(--accent-amber-bg)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.35rem' }}>
                Pending Requests ({pendingRequests.length})
              </div>
              {pendingRequests.map((req) => (
                <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', fontSize: '0.75rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.sender_name}</span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleRespond(req.id, 'accept')} className="btn btn-navy btn-xs" style={{ padding: '2px 5px' }}>Accept</button>
                    <button onClick={() => handleRespond(req.id, 'decline')} className="btn btn-secondary btn-xs" style={{ padding: '2px 5px' }}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Chats List */}
          <div className="card" style={{ padding: '0.75rem', flex: 1 }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Conversations
            </div>
            {activeChats.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No active direct chats yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {activeChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedPartner(chat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.4rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      border: selectedPartner?.id === chat.id ? '1px solid var(--primary-color)' : '1px solid transparent',
                      backgroundColor: selectedPartner?.id === chat.id ? 'var(--primary-subtle)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div className="avatar-circle" style={{ width: '22px', height: '22px', fontSize: '0.6875rem' }}>
                      {chat.partner_name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.78125rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {chat.partner_name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Active Message Box */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          {selectedPartner ? (
            <>
              <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-navy)' }}>{selectedPartner.partner_name}</h2>
                  <span className="badge badge-navy" style={{ marginTop: '0.15rem' }}>Code: {selectedPartner.partner_code}</span>
                </div>
              </div>

              {/* Chat Thread */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.65rem', maxHeight: '380px', paddingRight: '0.25rem' }}>
                {messages.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', margin: 'auto' }}>
                    No messages in this chat yet. Send a message below.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isPartner = m.sender_id === selectedPartner.partner_id;

                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isPartner ? 'flex-start' : 'flex-end',
                          backgroundColor: isPartner ? 'var(--bg-subtle)' : 'var(--primary-navy)',
                          color: isPartner ? 'var(--text-primary)' : '#ffffff',
                          border: isPartner ? '1px solid var(--border-default)' : 'none',
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          maxWidth: '75%',
                          fontSize: '0.8125rem',
                          lineHeight: 1.4,
                        }}
                      >
                        {m.content}
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  placeholder="Type a private message..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  style={{ padding: '0.4rem 0.65rem', fontSize: '0.8125rem' }}
                />
                <button type="submit" className="btn btn-navy btn-sm">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center' }}>
              Select a conversation from the left or enter a user code to start chatting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
