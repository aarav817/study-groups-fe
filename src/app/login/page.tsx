'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { setUser } = useAuth();

  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.auth.login({ email, password });
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        router.push('/groups');
      } else {
        setError(res.error?.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('verify') || errMsg.includes('EMAIL_NOT_VERIFIED')) {
        setUnverifiedEmail(email);
      } else {
        setError(errMsg || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    try {
      setResending(true);
      setResendStatus('');
      const res = await api.auth.resendVerification(unverifiedEmail);
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

  if (unverifiedEmail) {
    return (
      <div className="auth-container">
        <div style={{ textAlign: 'center' }}>
          <span className="badge badge-amber" style={{ marginBottom: '0.75rem' }}>
            Action Required
          </span>
          <h2 className="modal-title" style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
            Email Verification Required
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
            Your account with <strong>{unverifiedEmail}</strong> requires verification before signing in. Please check your email inbox for the activation link.
          </p>

          {resendStatus && (
            <div
              className={`alert-banner ${
                resendStatus.includes('sent') || resendStatus.includes('resent') ? 'alert-success' : 'alert-danger'
              }`}
            >
              <span>{resendStatus}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={handleResend}
              className="btn btn-secondary"
              disabled={resending}
              style={{ width: '100%' }}
            >
              {resending ? 'Resending Link...' : 'Resend Verification Email'}
            </button>
            <button
              onClick={() => setUnverifiedEmail('')}
              className="btn btn-navy"
              style={{ width: '100%' }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
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

      <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary-navy)' }}>
        Sign In
      </h2>

      {error && (
        <div className="alert-banner alert-danger">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="alex@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-navy" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p style={{ marginTop: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78125rem' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
