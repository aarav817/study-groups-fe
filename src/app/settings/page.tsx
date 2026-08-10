'use client';

import React from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          Settings & Preferences
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Profile Preferences</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.75rem' }}>
              Manage your display name, profile photo, and direct messaging code.
            </p>
            <Link href="/account" className="btn btn-secondary btn-sm">
              Manage Account & Profile &rarr;
            </Link>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />

          <div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Notifications</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> Email notifications for new group messages & event invites
            </label>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />

          <div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Security</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Your account is authenticated via verified .edu university credentials and secure HTTP-Only session cookies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
