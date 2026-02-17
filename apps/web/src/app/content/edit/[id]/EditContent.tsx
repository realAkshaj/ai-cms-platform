'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AIAssistant from '../../../../components/AIAssistant';
import { API_URL } from '../../../../lib/config';

interface ContentData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: string;
  type: string;
  featuredImage: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
}

const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const getAuthToken = () => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found. Please log in again.');
  return token;
};

export default function EditContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState<ContentData>({
    title: '', slug: '', excerpt: '', content: '',
    status: 'DRAFT', type: 'POST', featuredImage: '',
    seoTitle: '', seoDescription: '', tags: []
  });

  useEffect(() => {
    if (id) fetchContent();
  }, [id]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/content/${id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to fetch content');
      const result = await response.json();
      const data = result.data;
      setFormData({
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        content: data.body || data.content || '',
        status: data.status || 'DRAFT',
        type: data.type || 'POST',
        featuredImage: data.featuredImage || '',
        seoTitle: data.seoTitle || '',
        seoDescription: data.seoDescription || '',
        tags: data.tags || [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load content');
      if (err.message.includes('authentication') || err.message.includes('token')) {
        localStorage.clear();
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (status?: string) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const token = getAuthToken();
      const payload = {
        ...formData,
        ...(status && { status }),
        slug: formData.slug || generateSlug(formData.title),
      };
      const response = await fetch(`${API_URL}/api/content/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to update content');
      alert('Content updated successfully!');
      router.push(`/content/view/${id}`);
    } catch (err: any) {
      if (err.message.includes('authentication') || err.message.includes('token') || err.message.includes('expired')) {
        setError('Your session has expired. Redirecting to login...');
        localStorage.clear();
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        setError(err.message || 'Failed to save content.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAIContentGenerated = (aiContent: any) => {
    setFormData(prev => ({
      ...prev,
      ...(aiContent.title && { title: aiContent.title }),
      ...(aiContent.content && { content: aiContent.content }),
      ...(aiContent.excerpt && { excerpt: aiContent.excerpt }),
      ...(aiContent.seoTitle && { seoTitle: aiContent.seoTitle }),
      ...(aiContent.seoDescription && { seoDescription: aiContent.seoDescription }),
      ...(aiContent.suggestedTags && { tags: [...prev.tags, ...aiContent.suggestedTags.filter((tag: string) => !prev.tags.includes(tag))] })
    }));
    if (aiContent.title) {
      setFormData(prev => ({ ...prev, slug: generateSlug(aiContent.title) }));
    }
    alert('AI-generated content has been inserted successfully!');
  };

  const handleChange = (field: keyof ContentData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'title' && !formData.slug) {
      setFormData(prev => ({ ...prev, [field]: value, slug: generateSlug(value) }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: '500',
    color: 'var(--text-secondary)', marginBottom: '8px',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: 0 }}>Loading content...</p>
      </div>
    );
  }

  if (previewMode) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <header className="glass-card" style={{
          borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none',
          padding: '12px 0', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setPreviewMode(false)} className="link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Editor
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleSave()} disabled={saving} className="btn-ghost btn-sm">Save</button>
              <button onClick={() => handleSave('PUBLISHED')} disabled={saving} className="btn-gradient btn-sm">Publish</button>
            </div>
          </div>
        </header>
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <span className="badge badge-draft">{formData.status.toLowerCase()}</span>
            <span className="badge badge-type">{formData.type}</span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 24px 0', lineHeight: '1.2' }}>
            {formData.title || 'Untitled'}
          </h1>
          {formData.excerpt && (
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
              {formData.excerpt}
            </p>
          )}
          <div className="content-prose" dangerouslySetInnerHTML={{ __html: formData.content || 'Start writing...' }} />
          {formData.tags.length > 0 && (
            <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {formData.tags.map((tag) => (<span key={tag} className="tag">#{tag}</span>))}
            </div>
          )}
        </main>
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
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/content" className="link" style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Content
            </Link>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>/</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600' }}>Edit</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setPreviewMode(true)} className="btn-ghost btn-sm">Preview</button>
            <button onClick={() => handleSave()} disabled={saving} className="btn-ghost btn-sm">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => handleSave('PUBLISHED')} disabled={saving} className="btn-gradient btn-sm">
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 24px 0' }}>
          <div className="alert alert-error">{error}</div>
        </div>
      )}

      {/* Main */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
          {/* Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Title & Slug */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Title *</label>
                <input type="text" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Your content title..." className="glass-input" style={{ fontSize: '18px', fontWeight: '600' }} />
              </div>
              <div>
                <label style={labelStyle}>URL Slug</label>
                <input type="text" value={formData.slug} onChange={(e) => handleChange('slug', e.target.value)} placeholder="auto-generated-from-title" className="glass-input" />
              </div>
            </div>

            {/* Excerpt */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <label style={labelStyle}>Excerpt</label>
              <textarea value={formData.excerpt} onChange={(e) => handleChange('excerpt', e.target.value)} placeholder="Brief description..." rows={3} className="glass-input" />
            </div>

            {/* Content Body */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ ...labelStyle, margin: 0 }}>Content *</label>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{formData.content.length} chars</span>
              </div>
              <textarea
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Write your content here or use the AI assistant..."
                rows={24}
                className="glass-input"
                style={{ fontFamily: 'Monaco, Consolas, monospace', fontSize: '13px', lineHeight: '1.7' }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Publish Settings */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0' }}>Settings</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Status</label>
                <select value={formData.status} onChange={(e) => handleChange('status', e.target.value)} className="glass-input">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={formData.type} onChange={(e) => handleChange('type', e.target.value)} className="glass-input">
                  <option value="POST">Blog Post</option>
                  <option value="PAGE">Page</option>
                  <option value="ARTICLE">Article</option>
                  <option value="NEWSLETTER">Newsletter</option>
                </select>
              </div>
            </div>

            {/* Featured Image */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0' }}>Featured Image</h3>
              <input type="url" value={formData.featuredImage} onChange={(e) => handleChange('featuredImage', e.target.value)} placeholder="https://example.com/image.jpg" className="glass-input" />
              {formData.featuredImage && (
                <img src={formData.featuredImage} alt="Featured" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginTop: '12px' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              )}
            </div>

            {/* Tags */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0' }}>Tags</h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Add tag..." className="glass-input" style={{ flex: 1 }} />
                <button onClick={addTag} className="btn-primary btn-sm">Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {formData.tags.map((tag) => (
                  <span key={tag} className="tag">
                    #{tag}
                    <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '14px', padding: '0 0 0 4px', lineHeight: '1' }}>
                      x
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* SEO */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0' }}>SEO</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>SEO Title</label>
                <input type="text" value={formData.seoTitle} onChange={(e) => handleChange('seoTitle', e.target.value)} placeholder="SEO optimized title..." className="glass-input" />
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '4px 0 0 0' }}>{formData.seoTitle?.length || 0}/60</p>
              </div>
              <div>
                <label style={labelStyle}>SEO Description</label>
                <textarea value={formData.seoDescription} onChange={(e) => handleChange('seoDescription', e.target.value)} placeholder="Meta description..." rows={3} className="glass-input" />
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '4px 0 0 0' }}>{formData.seoDescription?.length || 0}/160</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AIAssistant onContentGenerated={handleAIContentGenerated} currentContent={formData.content} />
    </div>
  );
}
