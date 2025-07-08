'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CreateContentData {
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

// Real content service that connects to your API
const contentService = {
  generateSlug: (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
  
  createContent: async (data: CreateContentData) => {
    console.log('📤 Sending content to API:', data);
    
    // Debug all possible token locations
    console.log('🔍 All localStorage items:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        console.log(`  ${key}:`, value ? value.substring(0, 50) + '...' : 'null');
      }
    }
    
    // Try multiple token names that might be stored
    const accessToken = localStorage.getItem('accessToken');
    const token = localStorage.getItem('token');
    const authToken = localStorage.getItem('authToken');
    
    console.log('🔐 accessToken:', accessToken ? 'Found' : 'Not found');
    console.log('🔐 token:', token ? 'Found' : 'Not found');
    console.log('🔐 authToken:', authToken ? 'Found' : 'Not found');
    
    const finalToken = accessToken || token || authToken;
    
    console.log('🔐 Using token:', finalToken ? finalToken.substring(0, 30) + '...' : 'None');
    
    if (!finalToken) {
      throw new Error('No authentication token found. Please log in again.');
    }

    console.log('🌐 Making request to:', 'http://localhost:3001/api/content');

    try {
      const response = await fetch('http://localhost:3001/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalToken}`
        },
        body: JSON.stringify(data)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const result = await response.json();
      console.log('📥 Full API Response:', result);

      if (!response.ok) {
        console.error('❌ Request failed with status:', response.status);
        console.error('❌ Error details:', result);
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (!result.success) {
        console.error('❌ API returned success: false');
        throw new Error(result.message || 'Failed to create content');
      }

      return result.data;
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      throw fetchError;
    }
  }
};

export default function CreateContentPage() {
  console.log("🚀 BEAUTIFUL CREATE CONTENT PAGE LOADED!");
  
  const router = useRouter();
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateContentData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'DRAFT',
    type: 'POST',
    featuredImage: '',
    seoTitle: '',
    seoDescription: '',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');

  // Handle form changes
  const handleChange = (field: keyof CreateContentData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug when title changes
    if (field === 'title' && !formData.slug) {
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        slug: contentService.generateSlug(value)
      }));
    }
  };

  // Handle tag addition
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle tag input key press
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Save content
  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Starting save process...');

      const dataToSave = {
        ...formData,
        status,
        slug: formData.slug || contentService.generateSlug(formData.title)
      };

      console.log('📝 Data to save:', dataToSave);

      const savedContent = await contentService.createContent(dataToSave);
      
      console.log('✅ Content saved successfully:', savedContent);
      
      // Show success message
      alert(`🎉 Content ${status === 'PUBLISHED' ? 'published' : 'saved as draft'} successfully!`);
      
      // Redirect to content list
      router.push('/content');
    } catch (err: any) {
      console.error('❌ Error saving content:', err);
      
      // Check for specific error types
      if (err.message.includes('authentication') || 
          err.message.includes('token') || 
          err.message.includes('expired')) {
        setError('Your session has expired. Redirecting to login...');
        
        // Clear expired tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else if (err.message.includes('Network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to save content. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Preview content
  const renderPreview = () => (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Preview Header */}
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
            marginBottom: '24px'
          }}>
            <button
              onClick={() => setPreviewMode(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255, 255, 255, 0.8)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'color 0.2s ease'
              }}
            >
              ← Back to Editor
            </button>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={() => handleSave('DRAFT')}
                disabled={loading}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: loading ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🔖 Save Draft
              </button>
              <button
                onClick={() => handleSave('PUBLISHED')}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: loading ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🚀 Publish
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              background: formData.status === 'PUBLISHED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
              color: formData.status === 'PUBLISHED' ? '#22c55e' : '#eab308',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {formData.status}
            </span>
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#3b82f6',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {formData.type}
            </span>
          </div>
        </div>

        {/* Preview Content */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <article>
            {formData.featuredImage && (
              <div style={{ marginBottom: '32px' }}>
                <img 
                  src={formData.featuredImage} 
                  alt={formData.title}
                  style={{
                    width: '100%',
                    height: '300px',
                    objectFit: 'cover',
                    borderRadius: '16px'
                  }}
                />
              </div>
            )}

            <h1 style={{
              fontSize: '48px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '24px',
              lineHeight: '1.2'
            }}>
              {formData.title || 'Untitled'}
            </h1>
            
            {formData.excerpt && (
              <p style={{
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '32px',
                lineHeight: '1.6'
              }}>
                {formData.excerpt}
              </p>
            )}
            
            <div style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '16px',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap'
            }}>
              {formData.content || 'Start writing your amazing content...'}
            </div>

            {formData.tags.length > 0 && (
              <div style={{
                marginTop: '48px',
                paddingTop: '32px',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {formData.tags.map((tag) => (
                    <span key={tag} style={{
                      padding: '6px 12px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#93c5fd',
                      fontSize: '14px',
                      borderRadius: '20px'
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );

  if (previewMode) {
    return renderPreview();
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Link
                href="/content"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '16px',
                  transition: 'color 0.2s ease'
                }}
              >
                ← Back to Content
              </Link>
              <div>
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: 'white',
                  margin: 0
                }}>
                  Create Content
                </h1>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: '4px 0 0 0',
                  fontSize: '16px'
                }}>
                  Write amazing content with AI assistance
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={() => setPreviewMode(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background 0.2s ease'
                }}
              >
                👁️ Preview
              </button>
              <button
                onClick={() => handleSave('DRAFT')}
                disabled={loading}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: loading ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🔖 {loading ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={() => handleSave('PUBLISHED')}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: loading ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                }}
              >
                🚀 {loading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Main Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '32px'
        }}>
          {/* Content Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Title & Slug */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: 'white',
                    fontWeight: '600',
                    marginBottom: '8px',
                    fontSize: '16px'
                  }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Enter your content title..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: 'white',
                    fontWeight: '600',
                    marginBottom: '8px',
                    fontSize: '16px'
                  }}>
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="url-friendly-slug"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '14px',
                    margin: '8px 0 0 0'
                  }}>
                    Leave empty to auto-generate from title
                  </p>
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <label style={{
                display: 'block',
                color: 'white',
                fontWeight: '600',
                marginBottom: '8px',
                fontSize: '16px'
              }}>
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleChange('excerpt', e.target.value)}
                placeholder="Brief description of your content..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                  resize: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Content Body */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <label style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '16px'
                }}>
                  Content *
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '14px'
                  }}>
                    📄 {formData.content.length} characters
                  </span>
                </div>
              </div>
              <textarea
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Start writing your amazing content here..."
                rows={20}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'Monaco, Consolas, monospace',
                  lineHeight: '1.5',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px'
              }}>
                <span>💡 Tip: Use markdown syntax for formatting. AI assistance coming soon!</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Publish Settings */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{
                color: 'white',
                fontWeight: '600',
                marginBottom: '16px',
                fontSize: '18px',
                margin: '0 0 16px 0'
              }}>
                Publish Settings
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: 'white',
                    fontWeight: '600',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="DRAFT" style={{ background: '#374151', color: 'white' }}>Draft</option>
                    <option value="PUBLISHED" style={{ background: '#374151', color: 'white' }}>Published</option>
                    <option value="ARCHIVED" style={{ background: '#374151', color: 'white' }}>Archived</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: 'white',
                    fontWeight: '600',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Content Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="POST" style={{ background: '#374151', color: 'white' }}>Blog Post</option>
                    <option value="PAGE" style={{ background: '#374151', color: 'white' }}>Page</option>
                    <option value="ARTICLE" style={{ background: '#374151', color: 'white' }}>Article</option>
                    <option value="NEWSLETTER" style={{ background: '#374151', color: 'white' }}>Newsletter</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{
                color: 'white',
                fontWeight: '600',
                marginBottom: '16px',
                fontSize: '18px',
                margin: '0 0 16px 0'
              }}>
                Featured Image
              </h3>
              <input
                type="url"
                value={formData.featuredImage}
                onChange={(e) => handleChange('featuredImage', e.target.value)}
                placeholder="https://example.com/image.jpg"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {formData.featuredImage && (
                <div style={{ marginTop: '16px' }}>
                  <img 
                    src={formData.featuredImage} 
                    alt="Featured" 
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{
                color: 'white',
                fontWeight: '600',
                marginBottom: '16px',
                fontSize: '18px',
                margin: '0 0 16px 0'
              }}>
                Tags
              </h3>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add a tag..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={addTag}
                  style={{
                    padding: '8px 16px',
                    background: '#6366f1',
                    color: 'white',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Add
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {formData.tags.map((tag) => (
                  <span key={tag} style={{
                    padding: '6px 12px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                    fontSize: '12px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                  }}>
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#a5b4fc',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '0',
                        lineHeight: '1'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* SEO Settings */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{
                color: 'white',
                fontWeight: '600',
                marginBottom: '16px',
                fontSize: '18px',
                margin: '0 0 16px 0'
              }}>
                SEO Settings
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: 'white',
                    fontWeight: '600',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => handleChange('seoTitle', e.target.value)}
                    placeholder="SEO optimized title..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '12px',
                    margin: '4px 0 0 0'
                  }}>
                    {formData.seoTitle?.length || 0}/60 characters
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: 'white',
                    fontWeight: '600',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    SEO Description
                  </label>
                  <textarea
                    value={formData.seoDescription}
                    onChange={(e) => handleChange('seoDescription', e.target.value)}
                    placeholder="SEO meta description..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '12px',
                    margin: '4px 0 0 0'
                  }}>
                    {formData.seoDescription?.length || 0}/160 characters
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}