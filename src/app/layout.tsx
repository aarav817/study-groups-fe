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
          <Link href="/account" title="Account Profile" style={{ display: 'flex', alignItems: 'center' }}>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--primary-color)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-color)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </Link>

          <button onClick={logout} className="btn-logout">
            Log Out
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className={pathname === '/login' ? 'active' : ''}>
            Sign In
          </Link>
          <Link href="/signup" className="btn btn-primary btn-sm" style={{ color: 'white' }}>
            Get Started / Sign Up
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
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (!loading && !user && !isPublicPage) {
      router.replace('/login');
    }
  }, [loading, user, isPublicPage, router]);

  // While checking auth on protected pages, show nothing (avoids flash)
  if (!loading && !user && !isPublicPage) {
    return null;
  }

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="top-header">
        <Link href={user ? '/groups' : '/'} className="brand">
          Study App <span className="brand-badge">PROTOTYPE</span>
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
            <nav>
              <Link href="/groups" className={pathname.startsWith('/groups') ? 'active' : ''}>
                <span>Groups</span>
              </Link>
              <Link href="/calendar" className={pathname === '/calendar' ? 'active' : ''}>
                Calendar
              </Link>
              <Link href="/materials" className={pathname === '/materials' ? 'active' : ''}>
                Materials Library
              </Link>
              <Link href="/messages" className={pathname === '/messages' ? 'active' : ''}>
                Messages
              </Link>
              {(user?.is_admin || pathname === '/admin') && (
                <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>
                  <span>Admin Panel</span>
                </Link>
              )}
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
