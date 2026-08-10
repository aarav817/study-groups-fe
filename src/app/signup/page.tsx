'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { setUser } = useAuth();

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

      if (res.success && res.data?.user) {
        setUser(res.data.user);
        router.push('/groups');
      } else {
        setError(res.error?.message || 'Failed to create account.');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '440px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
        Create Your .edu Account
      </h2>

      {error && (
        <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--accent-rose-bg)', color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
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
          <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
            Must end with .edu for university verification.
          </small>
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

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
