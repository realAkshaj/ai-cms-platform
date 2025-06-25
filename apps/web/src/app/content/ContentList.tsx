'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  views?: number;
}

export default function ContentList() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Simulate loading content - replace with actual API call
    setTimeout(() => {
      setContentItems(mockContentData);
      setIsLoading(false);
    }, 1000);
  }, [router]);

  // Mock data - replace with actual API call
  const mockContentData: ContentItem[] = [
    {
      id: '1',
      title: 'Getting Started with Next.js 15',
      content: 'Next.js 15 introduces several exciting features that make React development even more enjoyable. In this comprehensive guide, we\'ll explore the new App Router, Server Components, and improved performance optimizations...',
      category: 'Technology',
      tags: ['nextjs', 'react', 'javascript', 'web-development'],
      status: 'published',
      createdAt: '2024-06-20T10:30:00Z',
      updatedAt: '2024-06-20T10:30:00Z',
      wordCount: 1250,
      views: 342
    },
    {
      id: '2',
      title: 'The Future of AI in Content Creation',
      content: 'Artificial Intelligence is revolutionizing how we create, edit, and optimize content. From automated writing assistance to smart SEO suggestions, AI tools are becoming indispensable for modern content creators...',
      category: 'AI & Machine Learning',
      tags: ['ai', 'content-creation', 'automation', 'future'],
      status: 'published',
      createdAt: '2024-06-19T14:15:00Z',
      updatedAt: '2024-06-19T16:22:00Z',
      wordCount: 980,
      views: 178
    },
    {
      id: '3',
      title: 'Building Scalable APIs with Express.js',
      content: 'Express.js remains one of the most popular frameworks for building APIs in Node.js. This tutorial covers best practices for creating scalable, maintainable APIs that can handle high traffic loads...',
      category: 'Development',
      tags: ['expressjs', 'nodejs', 'api', 'backend'],
      status: 'draft',
      createdAt: '2024-06-18T09:45:00Z',
      updatedAt: '2024-06-19T11:30:00Z',
      wordCount: 756
    },
    {
      id: '4',
      title: 'Modern CSS Techniques for 2024',
      content: 'CSS has evolved tremendously in recent years. Container queries, cascade layers, and new color functions are changing how we approach styling. Let\'s explore the most impactful CSS features you should be using...',
      category: 'Design',
      tags: ['css', 'design', 'frontend', 'web-design'],
      status: 'draft',
      createdAt: '2024-06-17T16:20:00Z',
      updatedAt: '2024-06-17T16:20:00Z',
      wordCount: 432
    }
  ];

  const categories = ['Technology', 'AI & Machine Learning', 'Development', 'Design', 'Business', 'Marketing'];

  // Filter content based on search and filters
  const filteredContent = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === '' || item.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleEdit = (id: string) => {
    router.push(`/content/edit/${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      setContentItems(prev => prev.filter(item => item.id !== id));
      alert('Content deleted successfully!');
    }
  };

  const handleStatusToggle = (id: string, currentStatus: 'draft' | 'published') => {
    const newStatus = currentStatus === 'draft' ? 'published' : 'draft';
    setContentItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, status: newStatus, updatedAt: new Date().toISOString() }
          : item
      )
    );
    alert(`Content ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: 'draft' | 'published') => {
    return status === 'published' 
      ? { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e', border: '#22c55e' }
      : { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24', border: '#fbbf24' };
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
                {contentItems.length}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                Total Articles
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>
                {contentItems.filter(item => item.status === 'published').length}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                Published
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>
                {contentItems.filter(item => item.status === 'draft').length}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                Drafts
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>
                {contentItems.reduce((sum, item) => sum + (item.views || 0), 0).toLocaleString()}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
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
                <option value="" style={{ background: '#1f2937' }}>All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category} style={{ background: '#1f2937' }}>
                    {category}
                  </option>
                ))}
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
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
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
                <option value="published" style={{ background: '#1f2937' }}>Published</option>
                <option value="draft" style={{ background: '#1f2937' }}>Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {filteredContent.length === 0 ? (
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
              {searchTerm || selectedCategory || selectedStatus ? 'No content found' : 'No content yet'}
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px' }}>
              {searchTerm || selectedCategory || selectedStatus 
                ? 'Try adjusting your search or filters'
                : 'Start creating amazing content for your audience'
              }
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
            {filteredContent.map((item) => {
              const statusColors = getStatusColor(item.status);
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
                      background: statusColors.bg,
                      color: statusColors.text,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: `1px solid ${statusColors.border}`,
                      textTransform: 'capitalize'
                    }}>
                      {item.status}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                      {formatDate(item.updatedAt)}
                    </div>
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
                    {item.content}
                  </p>

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
                      <span>📁 {item.category}</span>
                      <span>📊 {item.wordCount} words</span>
                      {item.views && <span>👀 {item.views} views</span>}
                    </div>
                  </div>

                  {/* Tags */}
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
                    <button
                      onClick={() => handleStatusToggle(item.id, item.status)}
                      style={{
                        background: item.status === 'draft' ? 'rgba(34, 197, 94, 0.8)' : 'rgba(251, 191, 36, 0.8)',
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
                      {item.status === 'draft' ? '🚀 Publish' : '📄 Unpublish'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
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
      </main>
    </div>
  );
}