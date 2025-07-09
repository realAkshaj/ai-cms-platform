import React, { useState } from 'react';

// --- Type Definitions ---
interface GeneratedContent {
  title: string;
  excerpt: string;
  wordCount: number;
  readingTime: number;
  // Add other properties if your API returns them
}

interface FormData {
  topic: string;
  type: 'ARTICLE' | 'POST' | 'NEWSLETTER' | 'PAGE';
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational';
  length: 'short' | 'medium' | 'long';
  audience: string; // Assuming audience is a string, adjust if needed
  keywords: string;
  includeSEO: boolean;
  includeOutline: boolean;
}

interface AIAssistantProps {
  onContentGenerated: (content: GeneratedContent | { title: string }) => void;
  currentContent?: string; // Optional prop
}

interface Option {
  value: string;
  label: string;
  emoji: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onContentGenerated, currentContent = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'ideas' | 'titles'>('generate');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  
  // Generation form state
  const [formData, setFormData] = useState<FormData>({
    topic: '',
    type: 'ARTICLE',
    tone: 'professional',
    length: 'medium',
    audience: '',
    keywords: '',
    includeSEO: true,
    includeOutline: true
  });

  // Content ideas state
  const [ideas, setIdeas] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>([]);

  const toneOptions: Option[] = [
    { value: 'professional', label: 'Professional', emoji: '💼' },
    { value: 'casual', label: 'Casual', emoji: '😊' },
    { value: 'friendly', label: 'Friendly', emoji: '🤝' },
    { value: 'authoritative', label: 'Authoritative', emoji: '🎓' },
    { value: 'conversational', label: 'Conversational', emoji: '💬' }
  ];

  const lengthOptions: Option[] = [
    { value: 'short', label: 'Short (300-500 words)', emoji: '📝' },
    { value: 'medium', label: 'Medium (800-1200 words)', emoji: '📄' },
    { value: 'long', label: 'Long (1500-2500 words)', emoji: '📚' }
  ];

  const typeOptions: Option[] = [
    { value: 'ARTICLE', label: 'Article', emoji: '📚' },
    { value: 'POST', label: 'Blog Post', emoji: '📝' },
    { value: 'NEWSLETTER', label: 'Newsletter', emoji: '📧' },
    { value: 'PAGE', label: 'Page', emoji: '📄' }
  ];

  const callAPI = async <T,>(endpoint: string, data: object): Promise<T> => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:3001/api/ai/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'AI request failed');
    }
    
    return result.data;
  };

  const generateContent = async () => {
    if (!formData.topic.trim()) {
      alert('Please enter a topic');
      return;
    }

    setLoading(true);
    try {
      const keywordsArray = formData.keywords 
        ? formData.keywords.split(',').map(k => k.trim()).filter(k => k)
        : [];

      const result = await callAPI<GeneratedContent>('generate', {
        ...formData,
        keywords: keywordsArray
      });

      setGeneratedContent(result);
    } catch (error: unknown) { // Explicitly type error as unknown
      console.error('Content generation error:', error);
      if (error instanceof Error) { // Type guard to narrow down error type
        alert(`Failed to generate content: ${error.message}`);
      } else {
        alert('Failed to generate content: An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateIdeas = async () => {
    if (!formData.topic.trim()) {
      alert('Please enter a topic to generate ideas');
      return;
    }

    setLoading(true);
    try {
      const result = await callAPI<{ ideas: string[] }>('ideas', {
        topic: formData.topic,
        count: 5
      });
      setIdeas(result.ideas);
    } catch (error: unknown) {
      console.error('Ideas generation error:', error);
      if (error instanceof Error) {
        alert(`Failed to generate ideas: ${error.message}`);
      } else {
        alert('Failed to generate ideas: An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateTitles = async () => {
    if (!formData.topic.trim()) {
      alert('Please enter a topic to generate titles');
      return;
    }

    setLoading(true);
    try {
      const result = await callAPI<{ titles: string[] }>('titles', {
        topic: formData.topic,
        count: 5
      });
      setTitles(result.titles);
    } catch (error: unknown) {
      console.error('Titles generation error:', error);
      if (error instanceof Error) {
        alert(`Failed to generate titles: ${error.message}`);
      } else {
        alert('Failed to generate titles: An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const insertContent = () => {
    if (generatedContent && onContentGenerated) {
      onContentGenerated(generatedContent);
      setGeneratedContent(null);
      setIsOpen(false);
    }
  };

  const insertIdea = (idea: string) => { // Explicitly type idea as string
    setFormData({ ...formData, topic: idea });
    setActiveTab('generate');
  };

  const insertTitle = (title: string) => { // Explicitly type title as string
    if (onContentGenerated) {
      onContentGenerated({ title }); // Pass title as an object
    }
  };

  if (!isOpen) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000
      }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { // Type the event object
            (e.target as HTMLButtonElement).style.transform = 'scale(1.1)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { // Type the event object
            (e.target as HTMLButtonElement).style.transform = 'scale(1)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
          }}
        >
          🤖
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '0',
      right: '0',
      width: '450px',
      height: '100vh',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '700'
          }}>
            🤖 AI Assistant
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
        <p style={{
          margin: 0,
          fontSize: '14px',
          opacity: 0.9
        }}>
          Generate amazing content with AI
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'rgba(0, 0, 0, 0.02)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        {[
          { key: 'generate', label: 'Generate', emoji: '✨' },
          { key: 'ideas', label: 'Ideas', emoji: '💡' },
          { key: 'titles', label: 'Titles', emoji: '📝' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'generate' | 'ideas' | 'titles')} // Cast to specific types
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: activeTab === tab.key ? 'white' : 'transparent',
              color: activeTab === tab.key ? '#667eea' : '#666',
              fontWeight: activeTab === tab.key ? '600' : '400',
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '2px solid #667eea' : 'none'
            }}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px'
      }}>
        {activeTab === 'generate' && (
          <div>
            {/* Topic Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px'
              }}>
                Topic *
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, topic: e.target.value })} // Type the event
                placeholder="e.g., Getting Started with AI"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => (e.target as HTMLInputElement).style.borderColor = '#667eea'} // Type and cast
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => (e.target as HTMLInputElement).style.borderColor = '#e5e7eb'} // Type and cast
              />
            </div>

            {/* Type Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px'
              }}>
                Content Type
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px'
              }}>
                {typeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, type: option.value as FormData['type'] })} // Cast to the specific union type
                    style={{
                      padding: '12px',
                      border: `2px solid ${formData.type === option.value ? '#667eea' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      background: formData.type === option.value ? 'rgba(102, 126, 234, 0.1)' : 'white',
                      color: formData.type === option.value ? '#667eea' : '#666',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {option.emoji} {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px'
              }}>
                Tone
              </label>
              <select
                value={formData.tone}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, tone: e.target.value as FormData['tone'] })} // Type and cast
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {toneOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Length Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px'
              }}>
                Length
              </label>
              <select
                value={formData.length}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, length: e.target.value as FormData['length'] })} // Type and cast
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {lengthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Keywords */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '8px'
              }}>
                Keywords (optional)
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, keywords: e.target.value })} // Type the event
                placeholder="AI, content, automation (comma separated)"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Options */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={formData.includeSEO}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, includeSEO: e.target.checked })} // Type the event
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px' }}>Include SEO optimization</span>
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={formData.includeOutline}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, includeOutline: e.target.checked })} // Type the event
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px' }}>Include content outline</span>
              </label>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateContent}
              disabled={loading || !formData.topic.trim()}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '20px'
              }}
            >
              {loading ? '🤖 Generating...' : '✨ Generate Content'}
            </button>

            {/* Generated Content Preview */}
            {generatedContent && (
              <div style={{
                background: 'rgba(102, 126, 234, 0.05)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '20px'
              }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  color: '#667eea',
                  fontSize: '16px'
                }}>
                  ✨ Generated Content Preview
                </h3>
                
                <div style={{
                  maxHeight: '200px',
                  overflow: 'auto',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ fontSize: '14px', color: '#333', margin: '0 0 8px 0' }}>
                    {generatedContent.title}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0' }}>
                    {generatedContent.excerpt}
                  </p>
                  <div style={{
                    fontSize: '11px',
                    color: '#999',
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <span>📊 {generatedContent.wordCount} words</span>
                    <span>⏱️ {generatedContent.readingTime} min read</span>
                  </div>
                </div>
                
                <button
                  onClick={insertContent}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  📝 Insert Content
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ideas' && (
          <div>
            <p style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              Get creative content ideas based on your topic.
            </p>
            
            <button
              onClick={generateIdeas}
              disabled={loading || !formData.topic.trim()}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '20px'
              }}
            >
              {loading ? '💡 Generating Ideas...' : '💡 Generate Ideas'}
            </button>

            {ideas.length > 0 && (
              <div>
                <h3 style={{
                  fontSize: '16px',
                  color: '#333',
                  marginBottom: '16px'
                }}>
                  💡 Content Ideas
                </h3>
                {ideas.map((idea, index) => (
                  <div
                    key={index}
                    onClick={() => insertIdea(idea)}
                    style={{
                      padding: '12px',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { // Type and cast
                      (e.target as HTMLDivElement).style.borderColor = '#667eea';
                      (e.target as HTMLDivElement).style.background = 'rgba(102, 126, 234, 0.05)';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { // Type and cast
                      (e.target as HTMLDivElement).style.borderColor = '#e5e7eb';
                      (e.target as HTMLDivElement).style.background = 'white';
                    }}
                  >
                    {idea}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'titles' && (
          <div>
            <p style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              Generate SEO-optimized title variations for your content.
            </p>
            
            <button
              onClick={generateTitles}
              disabled={loading || !formData.topic.trim()}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '20px'
              }}
            >
              {loading ? '📝 Generating Titles...' : '📝 Generate Titles'}
            </button>

            {titles.length > 0 && (
              <div>
                <h3 style={{
                  fontSize: '16px',
                  color: '#333',
                  marginBottom: '16px'
                }}>
                  📝 Title Variations
                </h3>
                {titles.map((title, index) => (
                  <div
                    key={index}
                    onClick={() => insertTitle(title)}
                    style={{
                      padding: '12px',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { // Type and cast
                      (e.target as HTMLDivElement).style.borderColor = '#8b5cf6';
                      (e.target as HTMLDivElement).style.background = 'rgba(139, 92, 246, 0.05)';
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { // Type and cast
                      (e.target as HTMLDivElement).style.borderColor = '#e5e7eb';
                      (e.target as HTMLDivElement).style.background = 'white';
                    }}
                  >
                    {title}
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