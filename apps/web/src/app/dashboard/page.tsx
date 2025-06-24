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
  const [hoveredLogout, setHoveredLogout] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const [hoveredAction, setHoveredAction] = useState<number | null>(null);

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // For demo purposes, we'll simulate user data
    // In a real app, you'd fetch this from your API
    setTimeout(() => {
      setUser({
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      });
      setIsLoading(false);
    }, 1000);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Handle action button clicks
  const handleActionClick = (actionText: string) => {
    switch (actionText) {
      case 'Create Content':
        router.push('/content/create');
        break;
      case 'View Analytics':
        // Placeholder for future analytics page
        alert('Analytics feature coming soon! 📊');
        break;
      case 'Customize Design':
        // Placeholder for future design customization
        alert('Design customization coming soon! 🎨');
        break;
      case 'Settings':
        // Placeholder for future settings page
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
    return null;
  }

  const stats = [
    { icon: '📝', title: 'Content Items', value: '0', subtitle: 'Ready to create your first post?' },
    { icon: '👀', title: 'Total Views', value: '0', subtitle: 'Your audience awaits' },
    { icon: '🤖', title: 'AI Suggestions', value: '∞', subtitle: 'Unlimited creativity' },
    { icon: '⚡', title: 'System Status', value: 'Online', subtitle: 'Everything is running smoothly' }
  ];

  const actions = [
    { icon: '✍️', text: 'Create Content', desc: 'Start writing with AI assistance' },
    { icon: '📊', text: 'View Analytics', desc: 'See how your content performs' },
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
              onMouseEnter={() => setHoveredLogout(true)}
              onMouseLeave={() => setHoveredLogout(false)}
              style={{
                background: hoveredLogout ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
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
              onMouseEnter={() => setHoveredStat(index)}
              onMouseLeave={() => setHoveredStat(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer',
                transform: hoveredStat === index ? 'translateY(-4px)' : 'translateY(0)'
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
                onMouseEnter={() => setHoveredAction(index)}
                onMouseLeave={() => setHoveredAction(null)}
                style={{
                  background: hoveredAction === index ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  transform: hoveredAction === index ? 'translateY(-2px)' : 'translateY(0)'
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

        {/* Progress Section */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.3) 0%, rgba(124, 58, 237, 0.3) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{
            color: 'white',
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 16px 0'
          }}>
            🎯 Your Journey
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <h4 style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 12px 0'
              }}>
                ✅ Getting Started
              </h4>
              <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', lineHeight: '1.5' }}>
                <div style={{ marginBottom: '6px' }}>✓ Account created successfully</div>
                <div style={{ marginBottom: '6px' }}>✓ Email verified</div>
                <div style={{ marginBottom: '6px' }}>✓ Dashboard accessed</div>
                <div style={{ opacity: 0.7 }}>→ Ready for content creation!</div>
              </div>
            </div>
            <div>
              <h4 style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 12px 0'
              }}>
                🔄 Coming Up Next
              </h4>
              <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', lineHeight: '1.5' }}>
                <div style={{ marginBottom: '6px' }}>○ Create your first content</div>
                <div style={{ marginBottom: '6px' }}>○ Explore AI features</div>
                <div style={{ marginBottom: '6px' }}>○ Customize your workspace</div>
                <div style={{ marginBottom: '6px' }}>○ Invite team members</div>
              </div>
            </div>
          </div>
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{
              color: 'white',
              fontSize: '14px',
              margin: 0,
              fontWeight: '500'
            }}>
              💡 <strong>Pro tip:</strong> This platform is actively being developed. 
              Exciting new features are coming soon!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}