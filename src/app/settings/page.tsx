'use client';

import React from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: '580px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings & Preferences</h1>
          <p className="page-subtitle">
            Manage your application preferences, notifications, and institutional security settings.
          </p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
              Notifications
            </h3>
            <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Control email alerts and study session reminders.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>Email notifications for new group messages, events, and chat requests</span>
            </label>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

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
