'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.toLowerCase().endsWith('.edu')) {
      setError('Please provide a valid university email address ending in .edu (e.g. alex@stanford.edu).');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.auth.signup({
        full_name: fullName,
        email,
        password,
      });

      if (res.success) {
        setSubmittedEmail(email);
      } else {
        setError(res.error?.message || 'Failed to create account.');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [resendStatus, setResendStatus] = useState('');
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!submittedEmail) return;
    try {
      setResending(true);
      setResendStatus('');
      const res = await api.auth.resendVerification(submittedEmail);
      if (res.success) {
        setResendStatus('Verification email resent! Please check your inbox.');
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
    <div className="auth-container">
      {submittedEmail ? (
        <div style={{ textAlign: 'center' }}>
          <span className="badge badge-emerald" style={{ marginBottom: '0.75rem' }}>
            Email Sent
          </span>
          <h2 className="modal-title" style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
            Check Your Email Inbox
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
            A verification link has been sent to <strong>{submittedEmail}</strong>. Please check your inbox and click the link to activate your university account.
          </p>

          {resendStatus && (
            <div
              className={`alert-banner ${
                resendStatus.includes('resent') ? 'alert-success' : 'alert-danger'
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
              {resending ? 'Resending Email...' : 'Resend Verification Email'}
            </button>
            <Link href="/login" className="btn btn-navy" style={{ display: 'inline-block', width: '100%', textDecoration: 'none' }}>
              Back to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <>
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
            Create Account
          </h2>

          {error && (
            <div className="alert-banner alert-danger">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                placeholder="Alice Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">University Email (.edu)</label>
              <input
                type="email"
                id="email"
                placeholder="alice@stanford.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', marginTop: '0.2rem', display: 'block' }}>
                Must be an active .edu address for institutional verification.
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-navy" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ marginTop: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78125rem' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
