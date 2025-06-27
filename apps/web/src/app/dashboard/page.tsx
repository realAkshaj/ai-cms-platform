'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    console.log('Dashboard: Checking authentication...'); // Debug log
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Dashboard: No token found, redirecting to login'); // Debug log
      router.push('/auth/login');
      return;
    }

    console.log('Dashboard: Token found:', token.substring(0, 20) + '...'); // Debug log

    // Try to get user data from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Dashboard: User data found:', parsedUser); // Debug log
        setUser({
          id: parsedUser.id || '1',
          firstName: parsedUser.firstName || 'User',
          lastName: parsedUser.lastName || '',
          email: parsedUser.email || 'user@example.com'
        });
      } catch (error) {
        console.error('Dashboard: Error parsing user data:', error);
        // Set default user if parsing fails
        setUser({
          id: '1',
          firstName: 'User',
          lastName: '',
          email: 'user@example.com'
        });
      }
    } else {
      console.log('Dashboard: No user data found, using defaults'); // Debug log
      // Set default user if no data found
      setUser({
        id: '1',
        firstName: 'User',
        lastName: '',
        email: 'user@example.com'
      });
    }

    setIsLoading(false);
  }, [router]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    console.log('Dashboard: Logging out...'); // Debug log
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
    console.log('Dashboard: Action clicked:', actionText); // Debug log
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

  if (isLoading) {
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

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h2>Authentication Error</h2>
          <p>Unable to load user data. Please try logging in again.</p>
          <button 
            onClick={() => router.push('/auth/login')}
            style={{
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: '📝', title: 'Content Items', value: '0', subtitle: 'Ready to create your first post?' },
    { icon: '👀', title: 'Total Views', value: '0', subtitle: 'Your audience awaits' },
    { icon: '🤖', title: 'AI Suggestions', value: '∞', subtitle: 'Unlimited creativity' },
    { icon: '⚡', title: 'System Status', value: 'Online', subtitle: 'Everything is running smoothly' }
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
                  {user.firstName} {user.lastName}
                </span>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>
                  {user.email}
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
            {getGreeting()}, {user.firstName}! 👋
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
          {stats.map((stat, index) => (
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

        {/* Success Message */}
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
            🎉 Welcome to Your AI CMS Platform!
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            margin: '0 0 24px 0',
            lineHeight: '1.6'
          }}>
            Your authentication system is working perfectly! You can now create content, 
            manage your articles, and explore all the features of your platform.
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
              ✍️ Create Your First Article
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
              📚 View Content Library
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}