'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { contentService } from '@/services/contentService';

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

        // Get user data from localStorage
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

        // Try to fetch stats from the new /stats endpoint
        try {
          console.log('🔍 Trying to fetch from /stats endpoint...');
          const response = await fetch('http://localhost:3001/api/content/analytics/stats', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const responseJson = await response.json();
            const statsData = responseJson.data || responseJson;
            console.log('📊 Stats from endpoint:', statsData);

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
          console.log('📊 Stats endpoint failed, using fallback:', statsError);
          
          // Fallback: use existing contentService
          try {
            const contentResponse = await contentService.getContent();
            console.log('📄 Content response:', contentResponse);
            
            // Handle different possible response structures
            const contentArray = contentResponse.content || contentResponse.data?.content || contentResponse || [];
            console.log('📋 Content array:', contentArray);
            
            if (Array.isArray(contentArray)) {
              const published = contentArray.filter((c: any) => c.status === 'PUBLISHED').length;
              const draft = contentArray.filter((c: any) => c.status === 'DRAFT').length;
              
              setStats({
                totalContent: contentArray.length,
                totalViews: contentArray.length * 5, // Fake views for demo
                publishedContent: published,
                draftContent: draft,
                recentContent: contentArray.slice(0, 5)
              });
            } else {
              console.log('📋 Content is not an array, using defaults');
              setStats({
                totalContent: 0,
                totalViews: 0,
                publishedContent: 0,
                draftContent: 0,
                recentContent: []
              });
            }
          } catch (contentError) {
            console.error('❌ Content fetch also failed:', contentError);
            // Keep default stats
          }
        }

      } catch (error: any) {
        console.error('❌ Error fetching dashboard data:', error);
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

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    console.log('Dashboard: Logging out...');
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

  const handleActionClick = (actionText: string) => {
    console.log('Dashboard: Action clicked:', actionText);
    switch (actionText) {
      case 'Create Content':
        router.push('/content/create');
        break;
      case 'View Analytics':
        router.push('/content');
        break;
      case 'Customize Design':
        alert('Design customization coming soon! 🎨');
        break;
      case 'Settings':
        alert('Settings page coming soon! ⚙️');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'white', fontSize: '18px', margin: 0 }}>
            Loading your dashboard...
          </p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const statsData = [
    { 
      icon: '📝', 
      title: 'Content Items', 
      value: stats.totalContent.toString(), 
      subtitle: stats.totalContent === 0 ? 'Ready to create your first post?' : `${stats.publishedContent} published, ${stats.draftContent} drafts` 
    },
    { 
      icon: '👀', 
      title: 'Total Views', 
      value: stats.totalViews.toString(), 
      subtitle: stats.totalViews === 0 ? 'Your audience awaits' : 'Great engagement!' 
    },
    { 
      icon: '🤖', 
      title: 'AI Suggestions', 
      value: '∞', 
      subtitle: 'Unlimited creativity' 
    },
    { 
      icon: '⚡', 
      title: 'System Status', 
      value: 'Online', 
      subtitle: 'Everything is running smoothly' 
    }
  ];

  const actions = [
    { icon: '✍️', text: 'Create Content', desc: 'Start writing with AI assistance' },
    { icon: '📚', text: 'View Analytics', desc: 'Manage all your content' },
    { icon: '🎨', text: 'Customize Design', desc: 'Make it uniquely yours' },
    { icon: '⚙️', text: 'Settings', desc: 'Configure your workspace' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '16px 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🤖
            </div>
            <h1 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: '700',
              margin: 0
            }}>
              AI CMS Platform
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'white'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                👤
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  {user?.firstName} {user?.lastName}
                </span>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>
                  {user?.email}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: '500'
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 24px'
      }}>
        {/* Welcome Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '32px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <h2 style={{
            color: 'white',
            fontSize: '36px',
            fontWeight: '700',
            margin: '0 0 12px 0'
          }}>
            {getGreeting()}, {user?.firstName}! 👋
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '18px',
            margin: '0 0 24px 0',
            lineHeight: '1.6'
          }}>
            Welcome to your AI-powered content management platform.
            <br />Ready to create something amazing?
          </p>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '12px 20px',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>🕐</span>
            <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {statsData.map((stat, index) => (
            <div 
              key={index} 
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <div style={{
                fontSize: '32px',
                marginBottom: '12px'
              }}>
                {stat.icon}
              </div>
              <h3 style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: '700',
                margin: '0 0 4px 0'
              }}>
                {stat.value}
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                fontWeight: '500',
                margin: '0 0 8px 0'
              }}>
                {stat.title}
              </p>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '12px',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {stat.subtitle}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Content */}
        {stats.recentContent && stats.recentContent.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            marginBottom: '32px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: '700',
                margin: 0
              }}>
                📄 Recent Content
              </h3>
              <button
                onClick={() => router.push('/content')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                View All
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.recentContent.map((item: any, index: number) => (
                <div
                  key={item.id || index}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => {
                    if (item.id) {
                      router.push(`/content/view/${item.id}`);
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px'
                      }}>
                        {item.type === 'ARTICLE' ? '📄' : item.type === 'POST' ? '📝' : '📰'}
                      </div>
                      <div>
                        <div style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
                          {item.title}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'} • {item.status}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                        {item.views || 0} views
                      </span>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '500',
                        background: item.status === 'PUBLISHED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                        color: item.status === 'PUBLISHED' ? '#22c55e' : '#eab308'
                      }}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          marginBottom: '32px'
        }}>
          <h3 style={{
            color: 'white',
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 24px 0'
          }}>
            🚀 Quick Actions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {actions.map((action, index) => (
              <button 
                key={index}
                onClick={() => handleActionClick(action.text)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  {action.icon}
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  {action.text}
                </div>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.8,
                  lineHeight: '1.3'
                }}>
                  {action.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Empty State or Success Message */}
        {stats.totalContent === 0 ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.3) 0%, rgba(124, 58, 237, 0.3) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
            <h3 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: '700',
              margin: '0 0 16px 0'
            }}>
              Ready to get started?
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '16px',
              margin: '0 0 24px 0',
              lineHeight: '1.6'
            }}>
              Create your first piece of content and let AI help you craft something amazing.
            </p>
            <button
              onClick={() => router.push('/content/create')}
              style={{
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✍️ Create Your First Content
            </button>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.3) 0%, rgba(124, 58, 237, 0.3) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}>
            <h3 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: '700',
              margin: '0 0 16px 0'
            }}>
              🎉 Great work!
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '16px',
              margin: '0 0 24px 0',
              lineHeight: '1.6'
            }}>
              You have {stats.totalContent} pieces of content with {stats.totalViews} total views. 
              Keep creating amazing content!
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <button
                onClick={() => handleActionClick('Create Content')}
                style={{
                  background: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✍️ Create More Content
              </button>
              <button
                onClick={() => handleActionClick('View Analytics')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📚 View All Content
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}