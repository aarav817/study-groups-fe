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
        setRequestMsg('Direct chat request sent!');
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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Private 1-on-1 chats with verified university classmates.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.25rem', minHeight: '500px' }}>
        {/* Left Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Send Chat Request */}
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>Send Chat Request</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Enter a classmate&apos;s 6-character user code.
            </p>
            {requestMsg && <div style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', background: 'var(--accent-emerald-bg)', color: 'var(--accent-emerald)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{requestMsg}</div>}
            {requestError && <div style={{ padding: '0.35rem 0.5rem', borderRadius: '4px', background: 'var(--accent-rose-bg)', color: 'var(--accent-rose)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{requestError}</div>}
            <form onSubmit={handleSendChatRequest} style={{ display: 'flex', gap: '0.35rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Code (e.g. AB12CD)"
                value={messagingCodeInput}
                onChange={(e) => setMessagingCodeInput(e.target.value.toUpperCase())}
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                required
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={sendingReq}>
                Send
              </button>
            </form>
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="card" style={{ padding: '0.875rem', border: '1px solid var(--accent-rose-bg)', backgroundColor: '#fff1f2' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '0.5rem' }}>
                Pending Requests ({pendingRequests.length})
              </h4>
              {pendingRequests.map((req) => (
                <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.8rem' }}>
                  <span>{req.sender_name}</span>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button onClick={() => handleRespond(req.id, 'accept')} className="btn btn-primary btn-sm" style={{ padding: '2px 6px' }}>Accept</button>
                    <button onClick={() => handleRespond(req.id, 'decline')} className="btn btn-secondary btn-sm" style={{ padding: '2px 6px' }}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Chats List */}
          <div className="card" style={{ padding: '0.875rem', flex: 1 }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Conversations</h3>
            {activeChats.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No active direct chats yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {activeChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedPartner(chat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '6px',
                      border: selectedPartner?.id === chat.id ? '1.5px solid var(--primary-color)' : '1px solid var(--border-color)',
                      backgroundColor: selectedPartner?.id === chat.id ? 'var(--primary-light)' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8rem' }}>
                      {chat.partner_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-color)' }}>{chat.partner_name}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{chat.partner_code}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Active Message Box - Compact Slim Chat Lines */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          {selectedPartner ? (
            <>
              <div style={{ paddingBottom: '0.625rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedPartner.partner_name}</h2>
                  <span className="badge badge-purple" style={{ marginTop: '0.15rem' }}>Code: {selectedPartner.partner_code}</span>
                </div>
              </div>

              {/* SLIM COMPACT CHAT BUBBLES */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem', maxHeight: '420px', paddingRight: '0.5rem' }}>
                {messages.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: 'auto' }}>No direct messages yet. Say hi! 👋</div>
                ) : (
                  messages.map((m) => {
                    const isPartner = m.sender_id === selectedPartner.partner_id;

                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isPartner ? 'flex-start' : 'flex-end',
                          backgroundColor: isPartner ? 'var(--panel-bg)' : 'var(--primary-color)',
                          color: isPartner ? 'var(--text-color)' : '#ffffff',
                          border: isPartner ? '1px solid var(--border-color)' : 'none',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          maxWidth: '75%',
                          fontSize: '0.85rem',
                          lineHeight: 1.4,
                        }}
                      >
                        {m.content}
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type a private message..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
              Select a direct chat partner or enter a 6-character user code to start chatting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
