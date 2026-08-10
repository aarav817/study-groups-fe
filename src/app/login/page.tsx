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
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

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
