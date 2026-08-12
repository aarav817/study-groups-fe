'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing or invalid email verification token.');
      return;
    }

    let isMounted = true;
    api.auth.verifyEmail(token)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to study groups...');
          setTimeout(() => {
            router.push('/groups');
          }, 1500);
        } else {
          setStatus('error');
          setMessage(res.error?.message || 'Failed to verify email address.');
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setStatus('error');
        setMessage(err.message || 'An error occurred during email verification.');
      });

    return () => {
      isMounted = false;
    };
  }, [searchParams, router, setUser]);

  return (
    <div className="auth-container" style={{ maxWidth: '480px', margin: '4rem auto', textAlign: 'center' }}>
      {status === 'loading' && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Verifying Your Account</h2>
          <p style={{ color: 'var(--text-muted)' }}>{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#10b981' }}>
            Email Verified!
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-rose)' }}>
            Verification Failed
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{message}</p>
          <a href="/login" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Back to Sign In
          </a>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
