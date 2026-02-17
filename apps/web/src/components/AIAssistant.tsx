import React, { useState } from 'react';
import { API_URL } from '../lib/config';

interface GeneratedContent {
  title: string;
  excerpt: string;
  wordCount: number;
  readingTime: number;
}

interface FormData {
  topic: string;
  type: 'ARTICLE' | 'POST' | 'NEWSLETTER' | 'PAGE';
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational';
  length: 'short' | 'medium' | 'long';
  audience: string;
  keywords: string;
  includeSEO: boolean;
  includeOutline: boolean;
}

interface AIAssistantProps {
  onContentGenerated: (content: GeneratedContent | { title: string }) => void;
  currentContent?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onContentGenerated, currentContent = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'ideas' | 'titles'>('generate');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  const [formData, setFormData] = useState<FormData>({
    topic: '', type: 'ARTICLE', tone: 'professional', length: 'medium',
    audience: '', keywords: '', includeSEO: true, includeOutline: true
  });

  const [ideas, setIdeas] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>([]);

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'authoritative', label: 'Authoritative' },
    { value: 'conversational', label: 'Conversational' },
  ];

  const lengthOptions = [
    { value: 'short', label: 'Short (300-500 words)' },
    { value: 'medium', label: 'Medium (800-1200 words)' },
    { value: 'long', label: 'Long (1500-2500 words)' },
  ];

  const typeOptions = [
    { value: 'ARTICLE', label: 'Article' },
    { value: 'POST', label: 'Blog Post' },
    { value: 'NEWSLETTER', label: 'Newsletter' },
    { value: 'PAGE', label: 'Page' },
  ];

  const callAPI = async <T,>(endpoint: string, data: object): Promise<T> => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/ai/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'AI request failed');
    return result.data;
  };

  const generateContent = async () => {
    if (!formData.topic.trim()) { alert('Please enter a topic'); return; }
    setLoading(true);
    try {
      const keywordsArray = formData.keywords
        ? formData.keywords.split(',').map(k => k.trim()).filter(k => k) : [];
      const result = await callAPI<GeneratedContent>('generate', { ...formData, keywords: keywordsArray });
      setGeneratedContent(result);
    } catch (error: unknown) {
      alert(error instanceof Error ? `Failed to generate content: ${error.message}` : 'Failed to generate content.');
    } finally { setLoading(false); }
  };

  const generateIdeas = async () => {
    if (!formData.topic.trim()) { alert('Please enter a topic to generate ideas'); return; }
    setLoading(true);
    try {
      const result = await callAPI<{ ideas: string[] }>('ideas', { topic: formData.topic, count: 5 });
      setIdeas(result.ideas);
    } catch (error: unknown) {
      alert(error instanceof Error ? `Failed to generate ideas: ${error.message}` : 'Failed to generate ideas.');
    } finally { setLoading(false); }
  };

  const generateTitles = async () => {
    if (!formData.topic.trim()) { alert('Please enter a topic to generate titles'); return; }
    setLoading(true);
    try {
      const result = await callAPI<{ titles: string[] }>('titles', { topic: formData.topic, count: 5 });
      setTitles(result.titles);
    } catch (error: unknown) {
      alert(error instanceof Error ? `Failed to generate titles: ${error.message}` : 'Failed to generate titles.');
    } finally { setLoading(false); }
  };

  const insertContent = () => {
    if (generatedContent && onContentGenerated) {
      onContentGenerated(generatedContent);
      setGeneratedContent(null);
      setIsOpen(false);
    }
  };

  const insertIdea = (idea: string) => {
    setFormData({ ...formData, topic: idea });
    setActiveTab('generate');
  };

  const insertTitle = (title: string) => {
    if (onContentGenerated) onContentGenerated({ title });
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: '500',
    color: 'var(--text-muted)', marginBottom: '8px',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  const tabs = [
    { key: 'generate' as const, label: 'Generate', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    )},
    { key: 'ideas' as const, label: 'Ideas', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6"/><path d="M10 22h4"/>
        <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>
      </svg>
    )},
    { key: 'titles' as const, label: 'Titles', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    )},
  ];

  // --- Floating button (closed state) ---
  if (!isOpen) {
    return (
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
        <button
          onClick={() => setIsOpen(true)}
          className="btn-gradient ai-fab"
          style={{
            width: '56px', height: '56px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
            padding: 0, border: 'none',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </button>
      </div>
    );
  }

  // --- Open panel ---
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: '420px', height: '100vh',
      background: 'var(--bg-surface)', borderLeft: '1px solid var(--glass-border)',
      boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.4)', zIndex: 1000,
      display: 'flex', flexDirection: 'column', isolation: 'isolate',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px', borderBottom: '1px solid var(--glass-border)',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            AI Assistant
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="btn-ghost"
            style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Generate content with AI assistance
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
              background: activeTab === tab.key ? 'var(--glass-bg-active)' : 'transparent',
              color: activeTab === tab.key ? 'var(--accent-blue)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.key ? '600' : '400',
              fontSize: '13px',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all var(--transition-fast)',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        {activeTab === 'generate' && (
          <div>
            {/* Topic */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Topic *</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Getting Started with AI"
                className="glass-input"
              />
            </div>

            {/* Content Type */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Content Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {typeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, type: option.value as FormData['type'] })}
                    className={formData.type === option.value ? 'ai-option-active' : 'ai-option'}
                    style={{
                      padding: '10px', borderRadius: 'var(--radius-md)',
                      border: `1px solid ${formData.type === option.value ? 'var(--accent-blue)' : 'var(--glass-border)'}`,
                      background: formData.type === option.value ? 'rgba(59, 130, 246, 0.1)' : 'var(--glass-bg)',
                      color: formData.type === option.value ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      textAlign: 'center', transition: 'all var(--transition-fast)',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Tone</label>
              <select
                value={formData.tone}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value as FormData['tone'] })}
                className="glass-input"
              >
                {toneOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Length */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Length</label>
              <select
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: e.target.value as FormData['length'] })}
                className="glass-input"
              >
                {lengthOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Keywords */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Keywords (optional)</label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="AI, content, automation (comma separated)"
                className="glass-input"
              />
            </div>

            {/* Checkboxes */}
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={formData.includeSEO}
                  onChange={(e) => setFormData({ ...formData, includeSEO: e.target.checked })}
                  style={{ accentColor: 'var(--accent-blue)' }}
                />
                Include SEO optimization
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={formData.includeOutline}
                  onChange={(e) => setFormData({ ...formData, includeOutline: e.target.checked })}
                  style={{ accentColor: 'var(--accent-blue)' }}
                />
                Include content outline
              </label>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateContent}
              disabled={loading || !formData.topic.trim()}
              className="btn-gradient"
              style={{ width: '100%', padding: '14px', fontSize: '14px', marginBottom: '20px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  Generating...
                </span>
              ) : 'Generate Content'}
            </button>

            {/* Generated Content Preview */}
            {generatedContent && (
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: 'var(--accent-blue)', fontSize: '14px', fontWeight: '600' }}>
                  Generated Content Preview
                </h3>
                <div style={{ maxHeight: '200px', overflow: 'auto', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', margin: '0 0 8px 0', fontWeight: '600' }}>
                    {generatedContent.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                    {generatedContent.excerpt}
                  </p>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                    <span>{generatedContent.wordCount} words</span>
                    <span>{generatedContent.readingTime} min read</span>
                  </div>
                </div>
                <button onClick={insertContent} className="btn-success" style={{ width: '100%', padding: '12px', fontSize: '13px' }}>
                  Insert Content
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ideas' && (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.6' }}>
              Get creative content ideas based on your topic.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Topic *</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Enter a topic..."
                className="glass-input"
              />
            </div>

            <button
              onClick={generateIdeas}
              disabled={loading || !formData.topic.trim()}
              className="btn-gradient"
              style={{ width: '100%', padding: '14px', fontSize: '14px', marginBottom: '20px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  Generating Ideas...
                </span>
              ) : 'Generate Ideas'}
            </button>

            {ideas.length > 0 && (
              <div>
                <h3 style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Content Ideas
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ideas.map((idea, index) => (
                    <button
                      key={index}
                      onClick={() => insertIdea(idea)}
                      className="glass-card-elevated"
                      style={{
                        padding: '14px 16px', cursor: 'pointer', fontSize: '13px',
                        color: 'var(--text-primary)', textAlign: 'left',
                        border: '1px solid var(--glass-border)', width: '100%',
                        background: 'var(--glass-bg)', lineHeight: '1.5',
                      }}
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'titles' && (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.6' }}>
              Generate SEO-optimized title variations for your content.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Topic *</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Enter a topic..."
                className="glass-input"
              />
            </div>

            <button
              onClick={generateTitles}
              disabled={loading || !formData.topic.trim()}
              className="btn-gradient"
              style={{ width: '100%', padding: '14px', fontSize: '14px', marginBottom: '20px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  Generating Titles...
                </span>
              ) : 'Generate Titles'}
            </button>

            {titles.length > 0 && (
              <div>
                <h3 style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Title Variations
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {titles.map((title, index) => (
                    <button
                      key={index}
                      onClick={() => insertTitle(title)}
                      className="glass-card-elevated"
                      style={{
                        padding: '14px 16px', cursor: 'pointer', fontSize: '13px',
                        fontWeight: '600', color: 'var(--text-primary)', textAlign: 'left',
                        border: '1px solid var(--glass-border)', width: '100%',
                        background: 'var(--glass-bg)', lineHeight: '1.5',
                      }}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
