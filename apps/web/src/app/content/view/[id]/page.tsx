'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '../../../../lib/config';

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

type ContentStatus = Content['status'];

export default function ContentViewPage() {
  const router = useRouter();
  const params = useParams();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) fetchContent(params.id as string);
  }, [params.id]);

  const fetchContent = async (id: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) { router.push('/auth/login'); return; }

      const response = await fetch(`${API_URL}/api/content/${id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to fetch content');
      const result = await response.json();
      setContent(result.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!content) return;
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/content/${content.id}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchContent(content.id);
      } else {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Failed to publish content');
      }
    } catch (error: unknown) {
      alert(error instanceof Error ? `Failed to publish: ${error.message}` : 'Failed to publish content');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: 0 }}>Loading content...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', maxWidth: '500px' }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '22px', margin: '0 0 12px 0' }}>Content Not Found</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 24px 0' }}>{error || "The content you're looking for doesn't exist."}</p>
          <Link href="/content" className="btn-primary">Back to Content</Link>
        </div>
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
          maxWidth: '900px', margin: '0 auto', padding: '0 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Link href="/content" className="link" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </Link>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => router.push(`/content/edit/${content.id}`)} className="btn-ghost btn-sm">
              Edit
            </button>
            {content.status === 'DRAFT' && (
              <button onClick={handlePublish} className="btn-success btn-sm">
                Publish
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Article */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <span className={`badge ${content.status === 'PUBLISHED' ? 'badge-published' : content.status === 'ARCHIVED' ? 'badge-archived' : 'badge-draft'}`}>
            {content.status.toLowerCase()}
          </span>
          <span className="badge badge-type">{content.type}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {formatDate(content.updatedAt)}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {content.views} views
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: '700',
          color: 'var(--text-primary)',
          margin: '0 0 24px 0',
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
        }}>
          {content.title}
        </h1>

        {/* Author */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '40px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--glass-border)',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '600', fontSize: '14px',
          }}>
            {content.author.firstName[0]}{content.author.lastName[0]}
          </div>
          <div>
            <p style={{ color: 'var(--text-primary)', fontWeight: '600', margin: 0, fontSize: '14px' }}>
              {content.author.firstName} {content.author.lastName}
            </p>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '13px' }}>
              {content.publishedAt ? formatDate(content.publishedAt) : formatDate(content.createdAt)}
            </p>
          </div>
        </div>

        {/* Featured Image */}
        {content.featuredImage && (
          <div style={{ marginBottom: '40px' }}>
            <img
              src={content.featuredImage}
              alt={content.title}
              style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
            />
          </div>
        )}

        {/* Excerpt */}
        {content.excerpt && (
          <div style={{
            padding: '20px 24px',
            borderLeft: '3px solid var(--accent-blue)',
            background: 'var(--glass-bg)',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            marginBottom: '32px',
          }}>
            <p style={{
              fontSize: '17px', color: 'var(--text-secondary)',
              margin: 0, lineHeight: '1.6', fontStyle: 'italic',
            }}>
              {content.excerpt}
            </p>
          </div>
        )}

        {/* Main Content */}
        <div
          className="content-prose"
          dangerouslySetInnerHTML={{ __html: (content as any).body || content.content || '' }}
        />

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div style={{
            marginTop: '48px', paddingTop: '24px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex', flexWrap: 'wrap', gap: '8px',
          }}>
            {content.tags.map((tag) => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        )}

        {/* SEO Info */}
        {(content.seoTitle || content.seoDescription) && (
          <div className="glass-card" style={{ padding: '24px', marginTop: '32px' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
              SEO Information
            </h3>
            {content.seoTitle && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</span>
                <p style={{ color: 'var(--text-primary)', margin: '4px 0 0 0', fontSize: '14px' }}>{content.seoTitle}</p>
              </div>
            )}
            {content.seoDescription && (
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</span>
                <p style={{ color: 'var(--text-primary)', margin: '4px 0 0 0', fontSize: '14px' }}>{content.seoDescription}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
