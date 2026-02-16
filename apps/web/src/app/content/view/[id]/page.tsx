// Create this file: apps/web/src/app/content/view/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// --- Type Definitions ---
interface Content {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; // Use union type for status
  type: 'POST' | 'PAGE' | 'ARTICLE' | 'NEWSLETTER'; // Use union type for type
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
  views: number;
  likes: number;
  shares: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Define specific types for the status and type keys
type ContentStatus = Content['status'];
type ContentType = Content['type'];

export default function ContentViewPage() {
  const router = useRouter();
  const params = useParams();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      // Ensure params.id is treated as a string
      fetchContent(params.id as string);
    }
  }, [params.id]);

  const fetchContent = async (id: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/content/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const result = await response.json();
      setContent(result.data);
    } catch (err: unknown) { // Type 'err' as 'unknown' and then narrow it
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while loading content.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/content/edit/${content?.id}`);
  };

  const handlePublish = async () => {
    if (!content) return;
    
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3001/api/content/${content.id}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh content
        fetchContent(content.id);
      } else {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Failed to publish content');
      }
    } catch (error: unknown) { // Type 'error' as 'unknown' and then narrow it
      console.error('Failed to publish content:', error);
      if (error instanceof Error) {
        alert(`Failed to publish content: ${error.message}`);
      } else {
        alert('Failed to publish content: An unknown error occurred.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Explicitly type the 'status' parameter to be one of the keys of 'colors'
  const getStatusColor = (status: ContentStatus) => {
    const colors = {
      'PUBLISHED': { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' },
      'DRAFT': { bg: 'rgba(234, 179, 8, 0.2)', color: '#eab308' },
      'ARCHIVED': { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280' }
    };
    // Type assertion is not strictly needed here if status is ContentStatus,
    // but useful if 'status' could be broader and you're sure it matches.
    return colors[status] || colors['DRAFT'];
  };

  // Explicitly type the 'type' parameter to be one of the keys of 'icons'
  const getTypeIcon = (type: ContentType) => {
    const icons = {
      'POST': '📝',
      'ARTICLE': '📚',
      'PAGE': '📄',
      'NEWSLETTER': '📧'
    };
    // Type assertion is not strictly needed here if type is ContentType,
    // but useful if 'type' could be broader and you're sure it matches.
    return icons[type] || '📝';
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
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite', // You'll need to define this @keyframes in a global CSS or styled-component
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: 'white', fontSize: '18px', margin: 0 }}>
            Loading content...
          </p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '40px',
            borderRadius: '20px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)'
          }}>
            <h1 style={{ fontSize: '24px', margin: '0 0 16px 0' }}>Content Not Found</h1>
            <p style={{ margin: '0 0 24px 0' }}>{error || 'The content you\'re looking for doesn\'t exist.'}</p>
            <Link
              href="/content"
              style={{
                background: '#3b82f6',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              ← Back to Content
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // content is guaranteed to be not null here due to the 'if (error || !content)' check above
  const statusColors = getStatusColor(content.status);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <Link
              href="/content"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255, 255, 255, 0.8)',
                textDecoration: 'none',
                fontSize: '16px'
              }}
            >
              ← Back to Content
            </Link>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleEdit}
                style={{
                  background: 'rgba(79, 70, 229, 0.8)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ✏️ Edit
              </button>
              
              {content.status === 'DRAFT' && (
                <button
                  onClick={handlePublish}
                  style={{
                    background: 'rgba(34, 197, 94, 0.8)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  🚀 Publish
                </button>
              )}
            </div>
          </div>

          {/* Content Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{
              ...statusColors,
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              {content.status.toLowerCase()}
            </span>
            
            <span style={{
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#3b82f6',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {getTypeIcon(content.type)} {content.type}
            </span>
            
            <span style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px'
            }}>
              📅 {formatDate(content.updatedAt)}
            </span>
            
            <span style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px'
            }}>
              👁️ {content.views} views
            </span>
          </div>
        </div>

        {/* Article Content */}
        <article style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '48px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          marginBottom: '32px'
        }}>
          {/* Featured Image */}
          {content.featuredImage && (
            <div style={{ marginBottom: '40px' }}>
              <img 
                src={content.featuredImage} 
                alt={content.title}
                style={{
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover',
                  borderRadius: '16px'
                }}
              />
            </div>
          )}

          {/* Title */}
          <h1 style={{
            fontSize: '48px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '24px',
            lineHeight: '1.2'
          }}>
            {content.title}
          </h1>
          
          {/* Author & Date */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '18px'
            }}>
              {content.author.firstName[0]}{content.author.lastName[0]}
            </div>
            <div>
              <p style={{
                color: 'white',
                fontWeight: '600',
                margin: '0 0 4px 0',
                fontSize: '16px'
              }}>
                {content.author.firstName} {content.author.lastName}
              </p>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0,
                fontSize: '14px'
              }}>
                Published {content.publishedAt ? formatDate(content.publishedAt) : formatDate(content.createdAt)}
              </p>
            </div>
          </div>
          
          {/* Excerpt */}
          {content.excerpt && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '32px',
              borderLeft: '4px solid #3b82f6'
            }}>
              <p style={{
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: 0,
                lineHeight: '1.6',
                fontStyle: 'italic'
              }}>
                {content.excerpt}
              </p>
            </div>
          )}
          
          {/* Main Content */}
          <div style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '18px',
            lineHeight: '1.8'
          }} 
          dangerouslySetInnerHTML={{ __html: (content as any).body || content.content || '' }}
          />

          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <div style={{
              marginTop: '48px',
              paddingTop: '32px',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{
                color: 'white',
                fontSize: '18px',
                marginBottom: '16px'
              }}>
                Tags
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {content.tags.map((tag) => (
                  <span key={tag} style={{
                    padding: '8px 16px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#93c5fd',
                    fontSize: '14px',
                    borderRadius: '20px',
                    fontWeight: '500'
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* SEO Info (for admins) */}
        {(content.seoTitle || content.seoDescription) && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              color: 'white',
              fontSize: '18px',
              marginBottom: '16px'
            }}>
              SEO Information
            </h3>
            {content.seoTitle && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>SEO Title:</span>
                <p style={{ color: 'white', margin: '4px 0 0 0' }}>{content.seoTitle}</p>
              </div>
            )}
            {content.seoDescription && (
              <div>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>SEO Description:</span>
                <p style={{ color: 'white', margin: '4px 0 0 0' }}>{content.seoDescription}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}