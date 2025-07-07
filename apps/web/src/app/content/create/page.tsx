'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  EyeIcon,
  DocumentTextIcon,
  RocketLaunchIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import { contentService, CreateContentData } from '@/services/contentService';

export default function CreateContentPage() {
  const router = useRouter();
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateContentData>({
    title: '',
    slug: '',
    excerpt: '',
    body: '',
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
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
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
    if (!formData.title.trim() || !formData.body.trim()) {
      setError('Title and body are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dataToSave = {
        ...formData,
        status,
        slug: formData.slug || contentService.generateSlug(formData.title)
      };

      await contentService.createContent(dataToSave);
      
      // Redirect to content list
      router.push('/content');
    } catch (err: any) {
      console.error('Error saving content:', err);
      setError(err.response?.data?.message || 'Failed to save content');
    } finally {
      setLoading(false);
    }
  };

  // Preview content
  const renderPreview = () => (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${contentService.getStatusColor(formData.status || 'DRAFT')}`}>
              {formData.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${contentService.getTypeColor(formData.type || 'POST')}`}>
              {formData.type}
            </span>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            {formData.title || 'Untitled'}
          </h1>
          
          {formData.excerpt && (
            <p className="text-xl text-slate-300 mb-6">{formData.excerpt}</p>
          )}
          
          {formData.featuredImage && (
            <div className="mb-6">
              <img 
                src={formData.featuredImage} 
                alt={formData.title}
                className="w-full h-64 object-cover rounded-xl"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div 
            className="text-slate-200 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ 
              __html: formData.body.replace(/\n/g, '<br />') 
            }}
          />
        </div>

        {/* Tags */}
        {formData.tags && formData.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t border-white/20">
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-blue-600/20 text-blue-300 text-sm rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setPreviewMode(false)}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Editor
            </button>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleSave('DRAFT')}
                disabled={loading}
                className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <BookmarkIcon className="w-5 h-5" />
                Save Draft
              </button>
              <button
                onClick={() => handleSave('PUBLISHED')}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2"
              >
                <RocketLaunchIcon className="w-5 h-5" />
                Publish
              </button>
            </div>
          </div>

          {/* Preview */}
          {renderPreview()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/content"
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Content
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Create Content</h1>
              <p className="text-slate-300">Write amazing content with AI assistance</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPreviewMode(true)}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <EyeIcon className="w-5 h-5" />
              Preview
            </button>
            <button
              onClick={() => handleSave('DRAFT')}
              disabled={loading}
              className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <BookmarkIcon className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave('PUBLISHED')}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2"
            >
              <RocketLaunchIcon className="w-5 h-5" />
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <label className="block text-white font-medium mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter your content title..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Slug */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <label className="block text-white font-medium mb-2">URL Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="url-friendly-slug"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-slate-400 text-sm mt-2">Leave empty to auto-generate from title</p>
            </div>

            {/* Excerpt */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <label className="block text-white font-medium mb-2">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleChange('excerpt', e.target.value)}
                placeholder="Brief description of your content..."
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Content Body */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-white font-medium">Content *</label>
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-400 text-sm">
                    {formData.body.length} characters
                  </span>
                </div>
              </div>
              <textarea
                value={formData.body}
                onChange={(e) => handleChange('body', e.target.value)}
                placeholder="Start writing your amazing content here..."
                rows={20}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
              />
              <p className="text-slate-400 text-sm mt-2">
                Tip: Use markdown syntax for formatting. AI assistance coming soon!
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4">Publish Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Content Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="POST">Blog Post</option>
                    <option value="PAGE">Page</option>
                    <option value="ARTICLE">Article</option>
                    <option value="NEWSLETTER">Newsletter</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4">Featured Image</h3>
              <input
                type="url"
                value={formData.featuredImage}
                onChange={(e) => handleChange('featuredImage', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {formData.featuredImage && (
                <div className="mt-4">
                  <img 
                    src={formData.featuredImage} 
                    alt="Featured" 
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4">Tags</h3>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-blue-600/20 text-blue-300 text-sm rounded-full flex items-center gap-2">
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-blue-300 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* SEO Settings */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4">SEO Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">SEO Title</label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => handleChange('seoTitle', e.target.value)}
                    placeholder="SEO optimized title..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-slate-400 text-xs mt-1">
                    {formData.seoTitle?.length || 0}/60 characters
                  </p>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">SEO Description</label>
                  <textarea
                    value={formData.seoDescription}
                    onChange={(e) => handleChange('seoDescription', e.target.value)}
                    placeholder="SEO meta description..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-slate-400 text-xs mt-1">
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