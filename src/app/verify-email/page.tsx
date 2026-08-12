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

  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resending, setResending] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    try {
      setResending(true);
      setResendStatus('');
      const res = await api.auth.resendVerification(resendEmail);
      if (res.success) {
        setResendStatus('Verification link sent! Check your inbox.');
      } else {
        setResendStatus(res.error?.message || 'Failed to resend email.');
      }
    } catch (err: any) {
      setResendStatus(err.message || 'Failed to resend email.');
    } finally {
      setResending(false);
    }
  };

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

          <form onSubmit={handleResend} style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <input
                type="email"
                placeholder="Enter your .edu email to resend"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '0.625rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
              />
            </div>
            {resendStatus && (
              <p style={{ fontSize: '0.875rem', color: resendStatus.includes('sent') ? '#10b981' : 'var(--accent-rose)', marginBottom: '0.75rem' }}>
                {resendStatus}
              </p>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={resending}>
              {resending ? 'Sending Email...' : 'Resend Verification Email'}
            </button>
          </form>

          <a href="/login" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'underline' }}>
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
