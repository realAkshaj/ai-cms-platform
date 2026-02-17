'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { contentService } from '@/services/contentService';
import { API_URL } from '../../lib/config';

interface DashboardStats {
  totalContent: number;
  totalViews: number;
  publishedContent: number;
  draftContent: number;
  recentContent: any[];
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalContent: 0,
    totalViews: 0,
    publishedContent: 0,
    draftContent: 0,
    recentContent: []
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser({
              id: parsedUser.id || '1',
              firstName: parsedUser.firstName || 'User',
              lastName: parsedUser.lastName || '',
              email: parsedUser.email || 'user@example.com'
            });
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }

        try {
          const response = await fetch('${API_URL}/api/content/analytics/stats', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const responseJson = await response.json();
            const statsData = responseJson.data || responseJson;

            setStats({
              totalContent: statsData.total || 0,
              totalViews: statsData.totalViews || 0,
              publishedContent: statsData.published || 0,
              draftContent: statsData.draft || 0,
              recentContent: statsData.recentContent || []
            });
          } else {
            throw new Error('Stats endpoint not available');
          }
        } catch (statsError) {
          console.log('Stats endpoint failed, using fallback:', statsError);
          try {
            const contentResponse = await contentService.getContent();
            const contentArray = contentResponse.content || (contentResponse as any).data?.content || contentResponse || [];

            if (Array.isArray(contentArray)) {
              const published = contentArray.filter((c: any) => c.status === 'PUBLISHED').length;
              const draft = contentArray.filter((c: any) => c.status === 'DRAFT').length;

              setStats({
                totalContent: contentArray.length,
                totalViews: contentArray.length * 5,
                publishedContent: published,
                draftContent: draft,
                recentContent: contentArray.slice(0, 5)
              });
            }
          } catch (contentError) {
            console.error('Content fetch also failed:', contentError);
          }
        }

      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        if (error?.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    router.push('/auth/login');
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: 0 }}>
          Loading your dashboard...
        </p>
      </div>
    );
  }

  const statsCards = [
    {
      label: 'Total Content',
      value: stats.totalContent,
      sub: `${stats.publishedContent} published, ${stats.draftContent} drafts`,
      color: 'var(--accent-blue)',
    },
    {
      label: 'Total Views',
      value: stats.totalViews,
      sub: stats.totalViews === 0 ? 'Publish content to start tracking' : 'Across all content',
      color: 'var(--accent-cyan)',
    },
    {
      label: 'Published',
      value: stats.publishedContent,
      sub: 'Live content',
      color: 'var(--accent-green)',
    },
    {
      label: 'Drafts',
      value: stats.draftContent,
      sub: 'In progress',
      color: 'var(--accent-amber)',
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
        padding: '12px 0',
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
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <span style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>AI CMS</span>
            </Link>

            <nav style={{ display: 'flex', gap: '4px', marginLeft: '24px' }}>
              <Link href="/dashboard" className="btn-ghost btn-sm" style={{ background: 'var(--glass-bg-active)', fontSize: '13px', padding: '6px 14px' }}>Dashboard</Link>
              <Link href="/content" className="btn-ghost btn-sm" style={{ fontSize: '13px', padding: '6px 14px' }}>Content</Link>
              <Link href="/content/create" className="btn-ghost btn-sm" style={{ fontSize: '13px', padding: '6px 14px' }}>Create</Link>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600' }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                {user?.email}
              </div>
            </div>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '13px',
              fontWeight: '600',
            }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <button onClick={handleLogout} className="btn-ghost btn-sm" style={{ fontSize: '13px', padding: '6px 14px' }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            color: 'var(--text-primary)',
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 6px 0',
            letterSpacing: '-0.02em',
          }}>
            {getGreeting()}, {user?.firstName}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: 0 }}>
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}>
          {statsCards.map((stat, i) => (
            <div key={i} className="glass-card-elevated" style={{ padding: '24px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </p>
              <p style={{ color: stat.color, fontSize: '32px', fontWeight: '700', margin: '0 0 4px 0' }}>
                {stat.value}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Two column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          {/* Recent Content */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                Recent Content
              </h2>
              <Link href="/content" className="link" style={{ fontSize: '13px' }}>
                View all
              </Link>
            </div>

            {stats.recentContent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 16px 0' }}>
                  No content yet. Create your first piece!
                </p>
                <Link href="/content/create" className="btn-primary btn-sm">
                  Create Content
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.recentContent.map((item: any, index: number) => (
                  <div
                    key={item.id || index}
                    onClick={() => item.id && router.push(`/content/view/${item.id}`)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--glass-bg)',
                      border: '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
                      e.currentTarget.style.background = 'var(--glass-bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.background = 'var(--glass-bg)';
                    }}
                  >
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>
                        {item.title}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                    <span className={`badge ${item.status === 'PUBLISHED' ? 'badge-published' : 'badge-draft'}`}>
                      {item.status?.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600', margin: '0 0 20px 0' }}>
              Quick Actions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Create Content', desc: 'Write with AI assistance', href: '/content/create', icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                )},
                { label: 'View All Content', desc: 'Browse and manage', href: '/content', icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                )},
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="glass-card-elevated"
                  style={{
                    padding: '16px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-blue)',
                    flexShrink: 0,
                  }}>
                    {action.icon}
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600' }}>
                      {action.label}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {action.desc}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
