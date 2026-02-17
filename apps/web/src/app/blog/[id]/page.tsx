'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  type: string;
  tags: string[];
  featuredImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string;
  views: number;
  author: { firstName: string; lastName: string };
  organization: { name: string };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function BlogPostPage() {
  const params = useParams();
  const id = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`${API_URL}/api/public/posts/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const json = await res.json();
        if (json.success) {
          setPost(json.data);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Failed to fetch post:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchPost();
  }, [id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div style={{ minHeight: '100vh' }}>
        {/* Header */}
        <header className="glass-card" style={{
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
          padding: '16px 0',
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
              <span style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em' }}>
                AI CMS
              </span>
            </Link>
            <Link href="/blog" className="btn-ghost btn-sm">Back to Blog</Link>
          </div>
        </header>

        <div style={{ textAlign: 'center', padding: '100px 24px' }}>
          <h1 style={{ fontSize: '32px', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Post Not Found</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            This post doesn&apos;t exist or is no longer published.
          </p>
          <Link href="/blog" className="btn-primary">
            Browse All Posts
          </Link>
        </div>
      </div>
    );
  }

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
            <span style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em' }}>
              AI CMS
            </span>
          </Link>
          <Link href="/blog" className="btn-ghost btn-sm">Back to Blog</Link>
        </div>
      </header>

      {/* Article */}
      <article style={{
        maxWidth: '780px',
        margin: '0 auto',
        padding: '48px 24px 80px',
      }}>
        {/* Type badge */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
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
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: '700',
          color: 'var(--text-primary)',
          margin: '0 0 16px 0',
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
        }}>
          {post.title}
        </h1>

        {/* Meta */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            By {post.author.firstName} {post.author.lastName}
          </span>
          <span style={{ color: 'var(--glass-border)' }}>|</span>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {formatDate(post.publishedAt)}
          </span>
          <span style={{ color: 'var(--glass-border)' }}>|</span>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {post.views} views
          </span>
        </div>

        {/* Featured image */}
        {post.featuredImage && (
          <div style={{
            marginBottom: '32px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--glass-border)',
          }}>
            <img
              src={post.featuredImage}
              alt={post.title}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>
        )}

        {/* Body */}
        <div
          className="content-prose"
          style={{
            color: 'var(--text-secondary)',
            fontSize: '16px',
            lineHeight: '1.8',
            wordBreak: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginTop: '40px',
            paddingTop: '24px',
            borderTop: '1px solid var(--glass-border)',
          }}>
            {post.tags.map((tag) => (
              <span key={tag} style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Back link */}
        <div style={{ marginTop: '48px' }}>
          <Link href="/blog" className="btn-ghost" style={{ fontSize: '14px' }}>
            &larr; Back to all posts
          </Link>
        </div>
      </article>

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
