'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <span className="badge badge-navy">
          verified university network
        </span>
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
        <svg style={{ width: '2rem', height: '2rem', color: 'var(--primary-color)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <h1
          className="font-serif"
          style={{
            fontSize: '2.75rem',
            fontWeight: 600,
            letterSpacing: '-0.025em',
            color: 'var(--primary-navy)',
            lineHeight: 1.15,
            margin: 0,
            textTransform: 'lowercase',
          }}
        >
          locked in<span className="logo-period">.</span>
        </h1>
      </div>

      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: '1.25rem',
          color: 'var(--text-secondary)',
          maxWidth: '560px',
          margin: '0 auto 1.5rem auto',
          lineHeight: 1.4,
        }}
      >
        A simple study platform to boost your focus.
      </p>

      <p
        style={{
          fontSize: '0.9375rem',
          color: 'var(--text-secondary)',
          maxWidth: '520px',
          margin: '0 auto 2rem auto',
          lineHeight: 1.5,
        }}
      >
        Structured study groups, organized course files, and direct communication for verified university students.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '3rem' }}>
        {user ? (
          <Link href="/groups" className="btn btn-navy" style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}>
            Open Workspace &rarr;
          </Link>
        ) : (
          <>
            <Link href="/signup" className="btn btn-navy" style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}>
              Create Account with .edu
            </Link>
            <Link href="/login" className="btn btn-secondary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}>
              Sign In
            </Link>
          </>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          textAlign: 'left',
        }}
      >
        <div className="card">
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Workspaces
          </div>
          <h3 className="card-title" style={{ fontSize: '1.05rem' }}>Course Study Groups</h3>
          <p className="card-description" style={{ margin: 0 }}>
            Dedicated public and invite-only study channels structured specifically around your university courses.
          </p>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Materials
          </div>
          <h3 className="card-title" style={{ fontSize: '1.05rem' }}>Organized File Directories</h3>
          <p className="card-description" style={{ margin: 0 }}>
            Upload, browse, and categorize notes, slide decks, and exam prep in clean folder hierarchies.
          </p>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Messaging
          </div>
          <h3 className="card-title" style={{ fontSize: '1.05rem' }}>Direct Peer Chat</h3>
          <p className="card-description" style={{ margin: 0 }}>
            Connect 1-on-1 with verified classmates using private 6-character user codes.
          </p>
        </div>
      </div>
    </div>
  );
}
