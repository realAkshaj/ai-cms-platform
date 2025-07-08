// apps/web/src/app/content/page.tsx
// Complete content management page in one file

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Content {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  type: 'POST' | 'PAGE' | 'ARTICLE' | 'NEWSLETTER';
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

interface ContentResponse {
  content: Content[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Real content service that connects to your backend
const contentService = {
  async getContent(filters: Record<string, any> = {}): Promise<ContentResponse> {
    console.log('📋 Fetching content from real database...');
    
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const url = `http://localhost:3001/api/content${params.toString() ? '?' + params : ''}`;
    console.log('🌐 Fetching from:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('📥 Content response:', result);

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch content');
    }

    return result.data;
  },

  async deleteContent(id: string): Promise<void> {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:3001/api/content/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to delete content');
    }
  },

  async publishContent(id: string): Promise<void> {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:3001/api/content/${id}/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to publish content');
    }
  },

  getStatusColor(status: string): React.CSSProperties {
    const colors: Record<string, React.CSSProperties> = {
      'PUBLISHED': { background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '1px solid #22c55e' },
      'DRAFT': { background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', border: '1px solid #eab308' },
      'ARCHIVED': { background: 'rgba(107, 114, 128, 0.2)', color: '#6b7280', border: '1px solid #6b7280' }
    };
    return colors[status] || colors['DRAFT'];
  },

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'POST': '📝',
      'ARTICLE': '📚',
      'PAGE': '📄',
      'NEWSLETTER': '📧'
    };
    return icons[type] || '📝';
  },

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  truncateText(text: string, length: number = 150): string {
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  }
};

export default function ContentListPage() {
  const router = useRouter();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Filters
  const [filters, setFilters] = useState<Record<string, string>>({
    search: '',
    status: '',
    type: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Check authentication and load content
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    loadContent();
  }, [router]);

  // Load content from real database
  const loadContent = async (newFilters: Record<string, string> = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const filtersToUse = { ...filters, ...newFilters };
      console.log('🔍 Loading content with filters:', filtersToUse);
      
      const response = await contentService.getContent({
        ...filtersToUse,
        page: pagination.page,
        limit: pagination.limit
      });
      
      console.log('✅ Content loaded:', response);
      setContent(response.content);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error('❌ Error loading content:', err);
      setError(err.message || 'Failed to load content');
      
      // Handle token expiration
      if (err.message.includes('token') || err.message.includes('authentication')) {
        localStorage.clear();
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadContent(newFilters);
  };

  // Handle delete
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    
    try {
      await contentService.deleteContent(id);
      await loadContent(); // Reload the list
    } catch (err: any) {
      setError(err.message || 'Failed to delete content');
    }
  };

  // Handle publish/unpublish
  const handlePublish = async (id: string) => {
    try {
      await contentService.publishContent(id);
      await loadContent(); // Reload the list
    } catch (err: any) {
      setError(err.message || 'Failed to publish content');
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/content/edit/${id}`);
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
            Loading your content...
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/dashboard" style={{
              color: 'rgba(255, 255, 255, 0.8)',
              textDecoration: 'none',
              fontSize: '24px'
            }}>
              ←
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                📚
              </div>
              <h1 style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: '700',
                margin: 0
              }}>
                Content Management
              </h1>
            </div>
          </div>
          
          <Link
            href="/content/create"
            onMouseEnter={() => setHoveredButton('create')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              background: hoveredButton === 'create' ? '#4338ca' : '#4f46e5',
              color: 'white',
              textDecoration: 'none',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ✍️ New Content
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Stats and Filters */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '24px 32px',
          marginBottom: '32px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* Quick Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>
                {pagination.total}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                Total Articles
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>
                {content.filter(item => item.status === 'PUBLISHED').length}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                Published
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>
                {content.filter(item => item.status === 'DRAFT').length}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                Drafts
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>
                {content.reduce((sum, item) => sum + (item.views || 0), 0).toLocaleString()}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                Total Views
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            alignItems: 'end'
          }}>
            <div>
              <label style={{
                display: 'block',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Search Content
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by title, content, or tags..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: 'white',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: 'white',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="" style={{ background: '#1f2937' }}>All Status</option>
                <option value="PUBLISHED" style={{ background: '#1f2937' }}>Published</option>
                <option value="DRAFT" style={{ background: '#1f2937' }}>Draft</option>
                <option value="ARCHIVED" style={{ background: '#1f2937' }}>Archived</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: 'white',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="" style={{ background: '#1f2937' }}>All Types</option>
                <option value="POST" style={{ background: '#1f2937' }}>Post</option>
                <option value="ARTICLE" style={{ background: '#1f2937' }}>Article</option>
                <option value="PAGE" style={{ background: '#1f2937' }}>Page</option>
                <option value="NEWSLETTER" style={{ background: '#1f2937' }}>Newsletter</option>
              </select>
            </div>

            <button
              onClick={() => loadContent()}
              style={{
                padding: '12px 16px',
                background: 'rgba(34, 197, 94, 0.2)',
                border: '2px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px',
                color: '#22c55e',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Content Grid */}
        {content.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '60px 32px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '12px' }}>
              No content found
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px' }}>
              Create your first piece of content to get started with AI-powered content management.
            </p>
            <Link
              href="/content/create"
              style={{
                background: '#4f46e5',
                color: 'white',
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ✍️ Create Your First Article
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {content.map((item) => {
              const statusColors = contentService.getStatusColor(item.status);
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredCard(item.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'transform 0.2s ease',
                    transform: hoveredCard === item.id ? 'translateY(-4px)' : 'translateY(0)',
                    cursor: 'pointer'
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{
                      ...statusColors,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {item.status.toLowerCase()}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                      {contentService.formatDate(item.updatedAt)}
                    </div>
                  </div>

                  {/* Type and Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '16px' }}>{contentService.getTypeIcon(item.type)}</span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', textTransform: 'uppercase' }}>
                      {item.type}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '700',
                    margin: '0 0 12px 0',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {item.title}
                  </h3>

                  {/* Content Preview */}
                  {item.excerpt && (
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      margin: '0 0 16px 0',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {contentService.truncateText(item.excerpt)}
                    </p>
                  )}

                  {/* Metadata */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <span>👁️ {item.views || 0} views</span>
                      <span>❤️ {item.likes || 0} likes</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                      {item.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.8)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '11px'
                        }}>
                          +{item.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Author */}
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '12px',
                    marginBottom: '16px'
                  }}>
                    by {item.author.firstName} {item.author.lastName}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(item.id)}
                      style={{
                        background: 'rgba(79, 70, 229, 0.8)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      ✏️ Edit
                    </button>
                    {item.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(item.id)}
                        style={{
                          background: 'rgba(34, 197, 94, 0.8)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          flex: 1
                        }}
                      >
                        🚀 Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.8)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Info */}
        {pagination.total > 0 && (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '24px',
            fontSize: '14px'
          }}>
            Showing {content.length} of {pagination.total} items
          </div>
        )}
      </main>
    </div>
  );
}