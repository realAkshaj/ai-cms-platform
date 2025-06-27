'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Content Creation',
      description: 'Generate high-quality content with intelligent AI assistance and writing suggestions',
      status: 'Coming Soon'
    },
    {
      icon: '📝',
      title: 'Complete Content Management',
      description: 'Create, edit, and publish content with our beautiful and intuitive editor',
      status: 'Available Now'
    },
    {
      icon: '🔐',
      title: 'Secure Authentication',
      description: 'Multi-tenant authentication system with JWT tokens and password protection',
      status: 'Available Now'
    },
    {
      icon: '📊',
      title: 'Analytics & Insights',
      description: 'Track content performance with detailed analytics and user engagement metrics',
      status: 'Coming Soon'
    },
    {
      icon: '🎨',
      title: 'Modern Design System',
      description: 'Beautiful, responsive interface with glassmorphism effects and smooth animations',
      status: 'Available Now'
    },
    {
      icon: '⚡',
      title: 'Real-time Collaboration',
      description: 'Work together with your team in real-time with live editing and comments',
      status: 'Coming Soon'
    }
  ];

  const getStatusColor = (status: string) => {
    return status === 'Available Now' 
      ? { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e', border: '#22c55e' }
      : { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24', border: '#fbbf24' };
  };

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
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onMouseEnter={() => setHoveredButton('dashboard')}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  background: hoveredButton === 'dashboard' ? '#4338ca' : '#4f46e5',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                🚀 Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onMouseEnter={() => setHoveredButton('login')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    background: hoveredButton === 'login' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onMouseEnter={() => setHoveredButton('register')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    background: hoveredButton === 'register' ? '#4338ca' : '#4f46e5',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '80px 24px',
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '60px 40px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          marginBottom: '60px'
        }}>
          <h2 style={{
            color: 'white',
            fontSize: '48px',
            fontWeight: '700',
            margin: '0 0 20px 0',
            lineHeight: '1.2'
          }}>
            The Future of Content Management
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '20px',
            margin: '0 0 40px 0',
            lineHeight: '1.6',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Create, manage, and publish amazing content with AI-powered assistance. 
            Built with modern technology for the next generation of content creators.
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {!isLoggedIn ? (
              <>
                <Link
                  href="/auth/register"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)'
                  }}
                >
                  🚀 Start Creating Content
                </Link>
                <Link
                  href="/auth/login"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  👋 Sign In
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)'
                }}
              >
                📊 Go to Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          marginBottom: '60px'
        }}>
          {features.map((feature, index) => {
            const statusColors = getStatusColor(feature.status);
            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  padding: '32px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'transform 0.2s ease',
                  transform: hoveredFeature === index ? 'translateY(-8px)' : 'translateY(0)',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '40px' }}>
                    {feature.icon}
                  </div>
                  <div style={{
                    background: statusColors.bg,
                    color: statusColors.text,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: `1px solid ${statusColors.border}`
                  }}>
                    {feature.status}
                  </div>
                </div>
                
                <h3 style={{
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: '700',
                  margin: '0 0 12px 0'
                }}>
                  {feature.title}
                </h3>
                
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Tech Stack */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{
            color: 'white',
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 20px 0'
          }}>
            Built with Modern Technology
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {[
              { name: 'Next.js 15', emoji: '⚡' },
              { name: 'TypeScript', emoji: '🔷' },
              { name: 'PostgreSQL', emoji: '🐘' },
              { name: 'Prisma ORM', emoji: '🔺' },
              { name: 'JWT Auth', emoji: '🔐' },
              { name: 'Docker', emoji: '🐳' }
            ].map((tech, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '16px 12px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  {tech.emoji}
                </div>
                <div style={{
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {tech.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '32px 24px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            margin: '0 0 16px 0'
          }}>
            Built with ❤️ for the future of content management
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap'
          }}>
            <a
              href="https://github.com/realAkshaj/ai-cms-platform"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🔗 GitHub Repository
            </a>
            {!isLoggedIn && (
              <Link
                href="/auth/register"
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}
              >
                🚀 Get Started
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}