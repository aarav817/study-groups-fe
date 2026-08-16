'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [emailVisibility, setEmailVisibility] = useState<'private' | 'public'>('private');
  const [messagingCodeVisibility, setMessagingCodeVisibility] = useState<'private' | 'public'>('private');
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`privacy_settings_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.emailVisibility) setEmailVisibility(parsed.emailVisibility);
          if (parsed.messagingCodeVisibility) setMessagingCodeVisibility(parsed.messagingCodeVisibility);
        } catch (e) {}
      }
    }
  }, [user]);

  const handleSavePrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && typeof window !== 'undefined') {
      localStorage.setItem(
        `privacy_settings_${user.id}`,
        JSON.stringify({
          emailVisibility,
          messagingCodeVisibility,
        })
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div style={{ maxWidth: '580px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings & Preferences</h1>
          <p className="page-subtitle">
            Manage your application preferences, profile privacy, notifications, and security.
          </p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Profile Identity */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
              Profile & Account Identity
            </h3>
            <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Update your full name, avatar photo, academic bio, and 6-character user code.
            </p>
            <Link href="/account" className="btn btn-secondary btn-xs">
              Manage Profile &rarr;
            </Link>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

          {/* Profile Privacy & Visibility */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
              Profile Privacy & Visibility
            </h3>
            <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Control whether other students can see your email address and messaging code when viewing your profile.
            </p>

            {savedSuccess && (
              <div className="alert-banner alert-success" style={{ padding: '0.4rem 0.65rem', marginBottom: '0.75rem' }}>
                <span>Privacy preferences saved successfully.</span>
              </div>
            )}

            <form onSubmit={handleSavePrivacy} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
                  University Email Visibility
                </label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setEmailVisibility('private')}
                    className={`btn ${emailVisibility === 'private' ? 'btn-navy' : 'btn-secondary'} btn-xs`}
                  >
                    Private (Default - Hidden)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailVisibility('public')}
                    className={`btn ${emailVisibility === 'public' ? 'btn-navy' : 'btn-secondary'} btn-xs`}
                  >
                    Public (Visible on Profile)
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.35rem' }}>
                  Messaging Code Visibility
                </label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setMessagingCodeVisibility('private')}
                    className={`btn ${messagingCodeVisibility === 'private' ? 'btn-navy' : 'btn-secondary'} btn-xs`}
                  >
                    Private (Default - Hidden)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessagingCodeVisibility('public')}
                    className={`btn ${messagingCodeVisibility === 'public' ? 'btn-navy' : 'btn-secondary'} btn-xs`}
                  >
                    Public (Visible on Profile)
                  </button>
                </div>
              </div>

              <div>
                <button type="submit" className="btn btn-navy btn-sm" style={{ marginTop: '0.25rem' }}>
                  Save Privacy Settings
                </button>
              </div>
            </form>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

          {/* Notifications */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
              Notifications
            </h3>
            <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Control email alerts and study session reminders.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
              <span>Email notifications for new group messages, events, and chat requests</span>
            </label>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

          {/* Institutional Security */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
              Institutional Security
            </h3>
            <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Your account is authenticated via verified university email credentials and secure HTTP-Only session cookies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
