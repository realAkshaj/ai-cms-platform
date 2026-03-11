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
    setIsOpen(false);
  };

  // --- FAB Button (Terminal style) ---
  if (!isOpen) {
    return (
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
        <button
          onClick={() => setIsOpen(true)}
          className="ai-fab"
          title="Open AI Assistant"
        >
          AI
        </button>
      </div>
    );
  }

  // --- Terminal Panel ---
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '440px',
      height: '100vh',
      background: 'linear-gradient(180deg, #0f0e0d 0%, #1a1816 100%)',
      borderLeft: '4px solid var(--accent-secondary)',
      boxShadow: '-12px 0 48px rgba(0, 0, 0, 0.8), inset 0 0 100px rgba(212, 255, 0, 0.02)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-mono)',
    }}>
      {/* Terminal Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '2px solid var(--accent-secondary)',
        background: '#0f0e0d',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{
              margin: '0 0 4px 0',
              fontSize: '14px',
              fontWeight: '700',
              color: 'var(--accent-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              &gt; AI_ASSISTANT
            </h2>
            <p style={{
              margin: 0,
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              gemini-2.5-flash ready
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              width: '28px',
              height: '28px',
              padding: 0,
              background: 'transparent',
              border: '2px solid var(--accent-secondary)',
              color: 'var(--accent-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '16px',
              fontWeight: '700',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-secondary)';
              e.currentTarget.style.color = '#0f0e0d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--accent-secondary)';
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Command Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--text-muted)',
        background: '#0a0a0a',
      }}>
        {[
          { key: 'generate' as const, label: 'generate' },
          { key: 'ideas' as const, label: 'ideas' },
          { key: 'titles' as const, label: 'titles' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === tab.key ? '#0f0e0d' : 'transparent',
              color: activeTab === tab.key ? 'var(--accent-secondary)' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-secondary)' : '2px solid transparent',
              transition: 'all var(--transition-fast)',
            }}
          >
            $ {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px',
        background: '#0f0e0d',
      }}>
        {activeTab === 'generate' && (
          <div>
            {/* Topic */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--accent-secondary)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'var(--font-mono)',
              }}>
                &gt; topic *
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Getting Started with AI"
                className="glass-input"
                style={{
                  background: '#0a0a0a',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Content Type */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--accent-secondary)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'var(--font-mono)',
              }}>
                &gt; type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {typeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, type: option.value as FormData['type'] })}
                    style={{
                      padding: '10px',
                      border: `2px solid ${formData.type === option.value ? 'var(--accent-secondary)' : 'var(--text-muted)'}`,
                      background: formData.type === option.value ? 'rgba(212, 255, 0, 0.1)' : '#0a0a0a',
                      color: formData.type === option.value ? 'var(--accent-secondary)' : 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all var(--transition-fast)',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--accent-secondary)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'var(--font-mono)',
              }}>
                &gt; tone
              </label>
              <select
                value={formData.tone}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value as FormData['tone'] })}
                className="glass-input"
                style={{
                  background: '#0a0a0a',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                }}
              >
                {toneOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Length */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--accent-secondary)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'var(--font-mono)',
              }}>
                &gt; length
              </label>
              <select
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: e.target.value as FormData['length'] })}
                className="glass-input"
                style={{
                  background: '#0a0a0a',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                }}
              >
                {lengthOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Keywords */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--accent-secondary)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'var(--font-mono)',
              }}>
                &gt; keywords
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="AI, content, automation"
                className="glass-input"
                style={{
                  background: '#0a0a0a',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Flags */}
            <div style={{
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingLeft: '12px',
              borderLeft: '2px solid var(--text-muted)',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
              }}>
                <input
                  type="checkbox"
                  checked={formData.includeSEO}
                  onChange={(e) => setFormData({ ...formData, includeSEO: e.target.checked })}
                  style={{ accentColor: 'var(--accent-secondary)' }}
                />
                --include-seo
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
              }}>
                <input
                  type="checkbox"
                  checked={formData.includeOutline}
                  onChange={(e) => setFormData({ ...formData, includeOutline: e.target.checked })}
                  style={{ accentColor: 'var(--accent-secondary)' }}
                />
                --include-outline
              </label>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateContent}
              disabled={loading || !formData.topic.trim()}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? 'var(--text-muted)' : 'var(--accent-secondary)',
                color: '#0f0e0d',
                border: '3px solid #0f0e0d',
                fontSize: '12px',
                fontWeight: '700',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '20px',
                transition: 'all var(--transition-fast)',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Generating<span className="terminal-cursor" />
                </span>
              ) : '$ run generate'}
            </button>

            {/* Generated Content Output */}
            {generatedContent && (
              <div style={{
                border: '2px solid var(--accent-secondary)',
                background: '#0a0a0a',
                padding: '16px',
                marginTop: '16px',
              }}>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--accent-secondary)',
                  marginBottom: '12px',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: '700',
                }}>
                  &gt; output
                </div>
                <div style={{
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '12px',
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>title:</span> {generatedContent.title}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>excerpt:</span> {generatedContent.excerpt}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>words:</span> {generatedContent.wordCount}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>read_time:</span> {generatedContent.readingTime}min
                  </div>
                </div>
                <button
                  onClick={insertContent}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--accent-primary)',
                    color: '#0f0e0d',
                    border: '3px solid #0f0e0d',
                    fontSize: '11px',
                    fontWeight: '700',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                  }}
                >
                  $ insert content
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ideas' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--accent-secondary)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'var(--font-mono)',
              }}>
                &gt; topic *
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., AI content creation"
                className="glass-input"
                style={{
                  background: '#0a0a0a',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                }}
              />
            </div>

            <button
              onClick={generateIdeas}
              disabled={loading || !formData.topic.trim()}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? 'var(--text-muted)' : 'var(--accent-secondary)',
                color: '#0f0e0d',
                border: '3px solid #0f0e0d',
                fontSize: '12px',
                fontWeight: '700',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '20px',
              }}
            >
              {loading ? 'Generating...' : '$ run ideas'}
            </button>

            {ideas.length > 0 && (
              <div style={{
                border: '2px solid var(--accent-secondary)',
                background: '#0a0a0a',
                padding: '0',
              }}>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--accent-secondary)',
                  padding: '12px 16px',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: '700',
                  borderBottom: '1px solid var(--text-muted)',
                }}>
                  &gt; results [{ideas.length}]
                </div>
                {ideas.map((idea, index) => (
                  <div
                    key={index}
                    onClick={() => insertIdea(idea)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: index < ideas.length - 1 ? '1px solid var(--text-muted)' : 'none',
                      cursor: 'pointer',
                      background: 'transparent',
                      transition: 'background var(--transition-fast)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(212, 255, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ color: 'var(--accent-secondary)' }}>{index + 1}.</span> {idea}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'titles' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--accent-secondary)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'var(--font-mono)',
              }}>
                &gt; topic *
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., AI tools for writers"
                className="glass-input"
                style={{
                  background: '#0a0a0a',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                }}
              />
            </div>

            <button
              onClick={generateTitles}
              disabled={loading || !formData.topic.trim()}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? 'var(--text-muted)' : 'var(--accent-secondary)',
                color: '#0f0e0d',
                border: '3px solid #0f0e0d',
                fontSize: '12px',
                fontWeight: '700',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '20px',
              }}
            >
              {loading ? 'Generating...' : '$ run titles'}
            </button>

            {titles.length > 0 && (
              <div style={{
                border: '2px solid var(--accent-secondary)',
                background: '#0a0a0a',
                padding: '0',
              }}>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--accent-secondary)',
                  padding: '12px 16px',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: '700',
                  borderBottom: '1px solid var(--text-muted)',
                }}>
                  &gt; results [{titles.length}]
                </div>
                {titles.map((title, index) => (
                  <div
                    key={index}
                    onClick={() => insertTitle(title)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: index < titles.length - 1 ? '1px solid var(--text-muted)' : 'none',
                      cursor: 'pointer',
                      background: 'transparent',
                      transition: 'background var(--transition-fast)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(212, 255, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ color: 'var(--accent-secondary)' }}>{index + 1}.</span> {title}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
