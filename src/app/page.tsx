'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
      <span className="badge badge-purple" style={{ marginBottom: '1.25rem', fontSize: '0.85rem', padding: '4px 12px' }}>
        🎓 Verified University Student Platform
      </span>

      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-color)', marginBottom: '1rem', lineHeight: 1.2 }}>
        Collaborative Study Groups for Higher Education
      </h1>

      <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto 2.25rem auto', lineHeight: 1.6 }}>
        Connect with university classmates, share organized study materials, schedule live review sessions, and message verified .edu students.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3.5rem' }}>
        {user ? (
          <Link href="/groups" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
            Go to My Groups &rarr;
          </Link>
        ) : (
          <>
            <Link href="/signup" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
              Get Started with .edu Email
            </Link>
            <Link href="/login" className="btn btn-secondary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
              Sign In
            </Link>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
        <div className="card">
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📚</div>
          <h3 className="card-title">Course Study Hubs</h3>
          <p className="card-description" style={{ margin: 0 }}>
            Create public or private study groups tailored to your specific university courses and departments.
          </p>
        </div>

        <div className="card">
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📁</div>
          <h3 className="card-title">Folder Hierarchy & Files</h3>
          <p className="card-description" style={{ margin: 0 }}>
            Upload notes, lecture slides, and past exams organized neatly in folder hierarchies.
          </p>
        </div>

        <div className="card">
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💬</div>
          <h3 className="card-title">Direct Messaging</h3>
          <p className="card-description" style={{ margin: 0 }}>
            Send 1-on-1 chat requests to classmates using custom 6-character user codes.
          </p>
        </div>
      </div>
    </div>
  );
}
