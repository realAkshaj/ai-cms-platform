'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/>
          <circle cx="12" cy="15" r="2"/>
        </svg>
      ),
      title: 'AI-Powered Creation',
      description: 'Generate high-quality content with intelligent AI assistance powered by Google Gemini.',
      available: true,
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      ),
      title: 'Content Management',
      description: 'Create, edit, and publish content with a beautiful, intuitive editor.',
      available: true,
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      title: 'Secure Auth',
      description: 'Multi-tenant authentication with JWT tokens and role-based access control.',
      available: true,
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
      title: 'Analytics',
      description: 'Track content performance with detailed analytics and engagement metrics.',
      available: true,
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
      title: 'SEO Optimization',
      description: 'Auto-generated SEO titles, descriptions, and keyword suggestions.',
      available: true,
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
      title: 'Modern Stack',
      description: 'Built with Next.js 15, TypeScript, Prisma, and PostgreSQL.',
      available: true,
    },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="glass-card" style={{
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        padding: '16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <span style={{
              color: 'var(--text-primary)',
              fontSize: '20px',
              fontWeight: '700',
              letterSpacing: '-0.02em',
            }}>
              AI CMS
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn-primary btn-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost btn-sm">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-gradient btn-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '100px 24px 80px',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: '20px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          color: 'var(--accent-blue)',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '24px',
        }}>
          Powered by Google Gemini AI
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: '700',
          color: 'var(--text-primary)',
          margin: '0 0 20px 0',
          lineHeight: '1.15',
          letterSpacing: '-0.03em',
        }}>
          Content management,{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            reimagined with AI
          </span>
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '18px',
          margin: '0 auto 40px',
          lineHeight: '1.7',
          maxWidth: '560px',
        }}>
          Create, manage, and publish content with AI-powered assistance.
          Built for the next generation of content creators.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {!isLoggedIn ? (
            <>
              <Link href="/auth/register" className="btn-gradient" style={{ padding: '14px 28px', fontSize: '15px' }}>
                Start Creating Free
              </Link>
              <Link href="/auth/login" className="btn-ghost" style={{ padding: '14px 28px', fontSize: '15px' }}>
                Sign In
              </Link>
            </>
          ) : (
            <Link href="/dashboard" className="btn-gradient" style={{ padding: '14px 28px', fontSize: '15px' }}>
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section style={{
        padding: '0 24px 80px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card-elevated"
              style={{ padding: '28px', textAlign: 'left' }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
                marginBottom: '16px',
              }}>
                {feature.icon}
              </div>

              <h3 style={{
                color: 'var(--text-primary)',
                fontSize: '17px',
                fontWeight: '600',
                margin: '0 0 8px 0',
              }}>
                {feature.title}
              </h3>

              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: 0,
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section style={{
        padding: '0 24px 80px',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3 style={{
            color: 'var(--text-primary)',
            fontSize: '20px',
            fontWeight: '600',
            margin: '0 0 24px 0',
          }}>
            Built with Modern Technology
          </h3>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            flexWrap: 'wrap',
          }}>
            {['Next.js 15', 'TypeScript', 'PostgreSQL', 'Prisma', 'JWT', 'Docker'].map((tech) => (
              <span
                key={tech}
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--glass-border)',
        padding: '24px',
        textAlign: 'center',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
          AI CMS Platform &middot; Built with Next.js, TypeScript & Gemini AI
        </p>
      </footer>
    </div>
  );
}
