'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '../../lib/config';

interface Content {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  type: 'POST' | 'PAGE' | 'ARTICLE' | 'NEWSLETTER';
  tags: string[];
  views: number;
  likes: number;
  shares: number;
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

const api = {
  async getContent(filters: Record<string, any> = {}): Promise<ContentResponse> {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const url = `${API_URL}/api/content${params.toString() ? '?' + params : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch content');
    return result.data;
  },

  async deleteContent(id: string): Promise<void> {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/content/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to delete content');
    }
  },

  async publishContent(id: string): Promise<void> {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/content/${id}/publish`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to publish content');
    }
  },

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  },
};

export default function ContentListPage() {
  const router = useRouter();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [filters, setFilters] = useState<Record<string, string>>({
    search: '', status: '', type: '', sortBy: 'updatedAt', sortOrder: 'desc'
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    loadContent();
  }, [router]);

  const loadContent = async (newFilters: Record<string, string> = {}) => {
    try {
      setLoading(true);
      setError(null);
      const filtersToUse = { ...filters, ...newFilters };
      const response = await api.getContent({ ...filtersToUse, page: pagination.page, limit: pagination.limit });
      setContent(response.content);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load content');
      if (err.message.includes('token') || err.message.includes('authentication')) {
        localStorage.clear();
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadContent(newFilters);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.deleteContent(id);
      await loadContent();
    } catch (err: any) {
      setError(err.message || 'Failed to delete content');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.publishContent(id);
      await loadContent();
    } catch (err: any) {
      setError(err.message || 'Failed to publish content');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: 0 }}>Loading content...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="glass-card" style={{
        borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none',
        padding: '12px 0', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '0 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))',
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <span style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700' }}>AI CMS</span>
            </Link>
            <nav style={{ display: 'flex', gap: '4px', marginLeft: '24px' }}>
              <Link href="/dashboard" className="btn-ghost btn-sm" style={{ fontSize: '13px', padding: '6px 14px' }}>Dashboard</Link>
              <Link href="/content" className="btn-ghost btn-sm" style={{ background: 'var(--glass-bg-active)', fontSize: '13px', padding: '6px 14px' }}>Content</Link>
              <Link href="/content/create" className="btn-ghost btn-sm" style={{ fontSize: '13px', padding: '6px 14px' }}>Create</Link>
            </nav>
          </div>
          <Link href="/content/create" className="btn-primary btn-sm">
            New Content
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '24px' }}>{error}</div>
        )}

        {/* Page title + filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>
              Content
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
              {pagination.total} item{pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => loadContent()} className="btn-ghost btn-sm">
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 180px', gap: '12px' }}>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search content..."
              className="glass-input"
            />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="glass-input"
            >
              <option value="">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="glass-input"
            >
              <option value="">All Types</option>
              <option value="POST">Post</option>
              <option value="ARTICLE">Article</option>
              <option value="PAGE">Page</option>
              <option value="NEWSLETTER">Newsletter</option>
            </select>
          </div>
        </div>

        {/* Content List */}
        {content.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 32px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', margin: '0 0 20px 0' }}>
              No content found
            </p>
            <Link href="/content/create" className="btn-primary">
              Create Your First Content
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {content.map((item) => (
              <div
                key={item.id}
                className="glass-card-elevated"
                style={{
                  padding: '20px 24px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '16px',
                  alignItems: 'center',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <Link
                      href={`/content/view/${item.id}`}
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: '16px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      className="link"
                    >
                      {item.title}
                    </Link>
                    <span className={`badge ${item.status === 'PUBLISHED' ? 'badge-published' : item.status === 'ARCHIVED' ? 'badge-archived' : 'badge-draft'}`}>
                      {item.status.toLowerCase()}
                    </span>
                    <span className="badge badge-type">{item.type}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <span>{item.author.firstName} {item.author.lastName}</span>
                    <span>{api.formatDate(item.updatedAt)}</span>
                    <span>{item.views || 0} views</span>
                    {item.tags?.length > 0 && (
                      <span style={{ color: 'var(--accent-violet)' }}>
                        {item.tags.slice(0, 2).join(', ')}
                        {item.tags.length > 2 ? ` +${item.tags.length - 2}` : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => router.push(`/content/view/${item.id}`)} className="btn-ghost btn-sm" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    View
                  </button>
                  <button onClick={() => router.push(`/content/edit/${item.id}`)} className="btn-ghost btn-sm" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    Edit
                  </button>
                  {item.status === 'DRAFT' && (
                    <button onClick={() => handlePublish(item.id)} className="btn-success btn-sm" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Publish
                    </button>
                  )}
                  <button onClick={() => handleDelete(item.id, item.title)} className="btn-danger btn-sm" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.total > 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '24px', fontSize: '13px' }}>
            Showing {content.length} of {pagination.total} items
          </p>
        )}
      </main>
    </div>
  );
}
