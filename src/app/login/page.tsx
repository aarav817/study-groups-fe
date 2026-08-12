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
        setResendStatus(res.error?.message || 'Failed to resend email.');
      }
    } catch (err: any) {
      setResendStatus(err.message || 'Failed to resend email.');
    } finally {
      setResending(false);
    }
  };

  if (unverifiedEmail) {
    return (
      <div className="auth-container" style={{ maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Email Verification Required
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Your account with <strong>{unverifiedEmail}</strong> requires email verification before signing in. Please check your inbox and click the link to activate your account.
          </p>

          {resendStatus && (
            <div style={{ padding: '0.75rem', borderRadius: '6px', background: resendStatus.includes('sent') || resendStatus.includes('resent') ? '#ecfdf5' : 'var(--accent-rose-bg)', color: resendStatus.includes('sent') || resendStatus.includes('resent') ? '#059669' : 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {resendStatus}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleResend}
              className="btn"
              disabled={resending}
              style={{ width: '100%', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
            >
              {resending ? 'Resending Email...' : 'Resend Verification Email'}
            </button>
            <button
              onClick={() => setUnverifiedEmail('')}
              className="btn btn-primary"
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
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
        Sign In to Study Groups
      </h2>

      {error && (
        <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--accent-rose-bg)', color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">University Email (.edu)</label>
          <input
            type="email"
            id="email"
            placeholder="alex@stanford.edu"
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

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
