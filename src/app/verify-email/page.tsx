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
          setMessage('Email verified successfully. Redirecting to your workspace...');
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
        setResendStatus('Verification link sent! Please check your inbox.');
      } else {
        setResendStatus(res.error?.message || 'Failed to resend verification email.');
      }
    } catch (err: any) {
      setResendStatus(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container" style={{ textAlign: 'center' }}>
      <div className="auth-header">
        <div className="auth-brand" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
          <svg style={{ width: '20px', height: '20px', color: 'var(--primary-color)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>locked in<span className="logo-period">.</span></span>
        </div>
        <div className="auth-tagline">A simple study platform to boost your focus.</div>
      </div>

      {status === 'loading' && (
        <div>
          <span className="badge badge-navy" style={{ marginBottom: '0.75rem' }}>
            Processing
          </span>
          <h2 className="modal-title" style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>
            Verifying Account
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div>
          <span className="badge badge-emerald" style={{ marginBottom: '0.75rem' }}>
            Verified
          </span>
          <h2 className="modal-title" style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>
            Email Verified
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div>
          <span className="badge badge-rose" style={{ marginBottom: '0.75rem' }}>
            Verification Error
          </span>
          <h2 className="modal-title" style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>
            Unable to Verify
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
            {message}
          </p>

          <form onSubmit={handleResend} style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <div className="form-group">
              <label>Resend Verification Link</label>
              <input
                type="email"
                placeholder="Enter your .edu email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
              />
            </div>
            {resendStatus && (
              <div
                className={`alert-banner ${
                  resendStatus.includes('sent') ? 'alert-success' : 'alert-danger'
                }`}
                style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}
              >
                <span>{resendStatus}</span>
              </div>
            )}
            <button type="submit" className="btn btn-navy" style={{ width: '100%' }} disabled={resending}>
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </form>

          <a href="/login" style={{ color: 'var(--primary-color)', fontSize: '0.78125rem', fontWeight: 600 }}>
            Back to Sign In
          </a>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loading verification status...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
