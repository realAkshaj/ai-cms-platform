'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  type: string;
  tags: string[];
  featuredImage: string | null;
  publishedAt: string;
  views: number;
  author: { firstName: string; lastName: string };
  organization: { name: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\n+/g, ' ').trim();
}

const TYPE_OPTIONS = ['', 'ARTICLE', 'POST', 'PAGE', 'NEWSLETTER'] as const;
const TYPE_LABELS: Record<string, string> = {
  '': 'All Types',
  ARTICLE: 'Articles',
  POST: 'Posts',
  PAGE: 'Pages',
  NEWSLETTER: 'Newsletters',
};

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '12');
      if (search) params.set('search', search);
      if (type) params.set('type', type);

      const res = await fetch(`${API_URL}/api/public/posts?${params}`);
      const json = await res.json();

      if (json.success) {
        setPosts(json.data.posts);
        setPagination(json.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, type]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
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
          </Link>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/" className="btn-ghost btn-sm">Home</Link>
            <Link href="/blog" className="btn-primary btn-sm">Blog</Link>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <section style={{
        padding: '60px 24px 40px',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: '700',
          color: 'var(--text-primary)',
          margin: '0 0 12px 0',
          letterSpacing: '-0.03em',
        }}>
          Blog
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '16px',
          margin: 0,
        }}>
          Explore our latest articles, insights, and updates.
        </p>
      </section>

      {/* Filters */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px 32px',
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <input
            type="text"
            placeholder="Search posts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="glass-card"
            style={{
              flex: '1 1 240px',
              padding: '10px 16px',
              fontSize: '14px',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px',
              background: 'var(--glass-bg)',
              outline: 'none',
            }}
          />
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="glass-card"
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px',
              background: 'var(--glass-bg)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Posts Grid */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px 60px',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
              {search || type ? 'No posts match your filters.' : 'No published posts yet.'}
            </p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
            }}>
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="glass-card-elevated"
                    style={{
                      padding: '24px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Type badge */}
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: 'var(--accent-blue)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                      }}>
                        {post.type}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      margin: '0 0 8px 0',
                      lineHeight: '1.4',
                    }}>
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        margin: '0 0 16px 0',
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {stripHtml(post.excerpt)}
                      </p>
                    )}

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag} style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 'auto',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--glass-border)',
                    }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {post.author.firstName} {post.author.lastName}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatDate(post.publishedAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '40px',
              }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-ghost btn-sm"
                  style={{ opacity: page <= 1 ? 0.4 : 1 }}
                >
                  Previous
                </button>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="btn-ghost btn-sm"
                  style={{ opacity: page >= pagination.totalPages ? 0.4 : 1 }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
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
