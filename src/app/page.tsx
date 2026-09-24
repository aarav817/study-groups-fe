'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="landing-panel">
      <div className="landing-accent" aria-hidden="true" />
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
        Study groups, organized course files, and a messaging system to help you ace all your classes.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '3rem' }}>
        {user ? (
          <Link href="/groups" className="btn btn-navy" style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}>
            Open Workspace &rarr;
          </Link>
        ) : (
          <>
            <Link href="/signup" className="btn btn-navy" style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}>
              Create Account
            </Link>
            <Link href="/login" className="btn btn-secondary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}>
              Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
