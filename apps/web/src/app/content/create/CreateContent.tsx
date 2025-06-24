'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ContentData {
  title: string;
  content: string;
  category: string;
  tags: string;
  status: 'draft' | 'published';
}

interface FormErrors {
  title?: string;
  content?: string;
  category?: string;
  general?: string;
}

export default function CreateContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ContentData>({
    title: '',
    content: '',
    category: '',
    tags: '',
    status: 'draft'
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  // Update word count when content changes
  useEffect(() => {
    const words = formData.content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [formData.content]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.trim().length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      // Simulate API call - replace with your actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const contentToSave = {
        ...formData,
        status,
        createdAt: new Date().toISOString(),
        wordCount
      };

      console.log('Saving content:', contentToSave);
      
      // For now, just show success and redirect
      alert(`Content ${status === 'draft' ? 'saved as draft' : 'published'} successfully!`);
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Save error:', error);
      setErrors({ general: 'Failed to save content. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const categories = [
    'Technology',
    'Business',
    'Marketing',
    'Design',
    'Development',
    'AI & Machine Learning',
    'Productivity',
    'Tutorial',
    'News',
    'Opinion'
  ];

  const getButtonStyle = (buttonType: string, isPrimary = false) => ({
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: isSaving ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    border: isPrimary ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
    background: isPrimary 
      ? (hoveredButton === buttonType ? '#4338ca' : '#4f46e5')
      : (hoveredButton === buttonType ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'),
    color: 'white',
    opacity: isSaving ? 0.7 : 1
  });

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
                ✍️
              </div>
              <h1 style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: '700',
                margin: 0
              }}>
                Create Content
              </h1>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              onMouseEnter={() => setHoveredButton('preview')}
              onMouseLeave={() => setHoveredButton(null)}
              style={getButtonStyle('preview')}
            >
              {isPreviewMode ? '📝 Edit' : '👁️ Preview'}
            </button>
            <span style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}>
              {wordCount} words
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {errors.general && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            color: '#fca5a5',
            fontSize: '14px'
          }}>
            {errors.general}
          </div>
        )}

        {isPreviewMode ? (
          /* Preview Mode */
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '40px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px'
            }}>
              📖 Preview Mode - This is how your content will look when published
            </div>
            
            <h1 style={{
              color: 'white',
              fontSize: '36px',
              fontWeight: '700',
              marginBottom: '16px',
              lineHeight: '1.2'
            }}>
              {formData.title || 'Your Article Title'}
            </h1>
            
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '32px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px'
            }}>
              <span>📁 {formData.category || 'Category'}</span>
              {formData.tags && <span>🏷️ {formData.tags}</span>}
              <span>📊 {wordCount} words</span>
            </div>
            
            <div style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '16px',
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap'
            }}>
              {formData.content || 'Your content will appear here...'}
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <form>
              {/* Title */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Article Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter an engaging title for your content..."
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: errors.title ? '2px solid #fca5a5' : '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    fontSize: '18px',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4f46e5';
                    e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.title ? '#fca5a5' : 'rgba(255, 255, 255, 0.2)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.title && (
                  <p style={{ color: '#fca5a5', fontSize: '12px', marginTop: '6px', margin: '6px 0 0 0' }}>
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Category and Tags Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '24px'
              }}>
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
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: errors.category ? '2px solid #fca5a5' : '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      fontSize: '14px',
                      color: 'white',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="" style={{ background: '#1f2937', color: 'white' }}>
                      Select a category
                    </option>
                    {categories.map(category => (
                      <option key={category} value={category} style={{ background: '#1f2937', color: 'white' }}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p style={{ color: '#fca5a5', fontSize: '12px', marginTop: '6px', margin: '6px 0 0 0' }}>
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="react, javascript, tutorial"
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
              </div>

              {/* Content Editor */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  Content
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Start writing your amazing content here... 

You can use markdown-style formatting:
- Use **bold** for emphasis
- Use *italic* for subtle emphasis  
- Use # for headings
- Use - for bullet points

Let your creativity flow!"
                  style={{
                    width: '100%',
                    minHeight: '400px',
                    padding: '20px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: errors.content ? '2px solid #fca5a5' : '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    color: 'white',
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: '1.6',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4f46e5';
                    e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.content ? '#fca5a5' : 'rgba(255, 255, 255, 0.2)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.content && (
                  <p style={{ color: '#fca5a5', fontSize: '12px', marginTop: '6px', margin: '6px 0 0 0' }}>
                    {errors.content}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px'
              }}>
                <Link href="/dashboard" style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  fontSize: '14px'
                }}>
                  ← Back to Dashboard
                </Link>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => handleSave('draft')}
                    disabled={isSaving}
                    onMouseEnter={() => setHoveredButton('draft')}
                    onMouseLeave={() => setHoveredButton(null)}
                    style={getButtonStyle('draft')}
                  >
                    {isSaving ? '💾 Saving...' : '📄 Save Draft'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleSave('published')}
                    disabled={isSaving}
                    onMouseEnter={() => setHoveredButton('publish')}
                    onMouseLeave={() => setHoveredButton(null)}
                    style={getButtonStyle('publish', true)}
                  >
                    {isSaving ? '🚀 Publishing...' : '🚀 Publish'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}