'use client';

import React, { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './globals.css';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

function HeaderNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="header-nav">
      {user ? (
        <>
          <Link href="/account" className="user-avatar-pill" title="Account profile & settings">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div className="avatar-circle">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <span>{user.full_name || 'Account'}</span>
          </Link>

          <button onClick={logout} className="btn-logout" title="Sign out of account">
            Sign Out
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className={pathname === '/login' ? 'active' : ''}>
            Sign In
          </Link>
          <Link href="/signup" className="btn btn-primary btn-sm">
            Sign Up
          </Link>
        </>
      )}
    </nav>
  );
}

function MainLayoutContent({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname === '/verify-email';

  useEffect(() => {
    if (!loading && !user && !isPublicPage) {
      router.replace('/login');
    }
  }, [loading, user, isPublicPage, router]);

  // While checking auth on protected pages, show clean placeholder to avoid flash
  if (!loading && !user && !isPublicPage) {
    return null;
  }

  return (
    <div className="app-container">
      {/* Top Navigation Header */}
      <header className="top-header">
        <Link href={user ? '/groups' : '/'} className="brand-container">
          <div className="brand-logo-group">
            <svg className="logo-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="brand-title">
              locked in<span className="logo-period">.</span>
            </span>
          </div>
          <span className="brand-tagline">A simple study platform to boost your focus.</span>
        </Link>
        <HeaderNav />
      </header>

      {/* Main Body */}
      {isPublicPage ? (
        <main style={{ flex: 1 }}>{children}</main>
      ) : (
        <div className="main-body">
          {/* Sidebar Navigation */}
          <aside className="sidebar">
            <div className="sidebar-heading">Workspace</div>
            <nav>
              <Link href="/groups" className={pathname.startsWith('/groups') ? 'active' : ''}>
                <span>Study Groups</span>
              </Link>
              <Link href="/calendar" className={pathname === '/calendar' ? 'active' : ''}>
                <span>Calendar</span>
              </Link>
              <Link href="/materials" className={pathname === '/materials' ? 'active' : ''}>
                <span>Materials</span>
              </Link>
              <Link href="/messages" className={pathname === '/messages' ? 'active' : ''}>
                <span>Direct Messages</span>
              </Link>
            </nav>

            {(user?.is_admin || pathname === '/admin') && (
              <>
                <div className="sidebar-heading" style={{ marginTop: '0.75rem' }}>Management</div>
                <nav>
                  <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>
                    <span>Telemetry & Admin</span>
                  </Link>
                </nav>
              </>
            )}

            <div className="sidebar-heading" style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>Preferences</div>
            <nav>
              <Link href="/account" className={pathname === '/account' ? 'active' : ''}>
                <span>Profile</span>
              </Link>
              <Link href="/settings" className={pathname === '/settings' ? 'active' : ''}>
                <span>Settings</span>
              </Link>
            </nav>
          </aside>

          {/* Content Area */}
          <main className="content-area">{children}</main>
        </div>
      )}
    </div>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <MainLayoutContent>{children}</MainLayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
