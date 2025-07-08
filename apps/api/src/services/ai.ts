// apps/api/src/services/ai.ts
// AI Content Generation Service using Google Gemini - Fixed TypeScript errors

import { GoogleGenerativeAI } from '@google/generative-ai';

interface GenerationRequest {
  type: 'POST' | 'ARTICLE' | 'NEWSLETTER' | 'PAGE';
  topic: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational';
  length?: 'short' | 'medium' | 'long';
  audience?: string;
  keywords?: string[];
  includeOutline?: boolean;
  includeSEO?: boolean;
}

interface GenerationResponse {
  title: string;
  content: string;
  excerpt: string;
  seoTitle?: string;
  seoDescription?: string;
  suggestedTags: string[];
  outline?: string[];
  wordCount: number;
  readingTime: number;
}

class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateContent(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      console.log('🤖 Starting AI content generation:', request);

      const prompt = this.buildPrompt(request);
      console.log('📝 Generated prompt:', prompt);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ AI generation complete, parsing response...');
      return this.parseResponse(text, request);
    } catch (error) {
      console.error('❌ AI generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`AI generation failed: ${errorMessage}`);
    }
  }

  private buildPrompt(request: GenerationRequest): string {
    const { type, topic, tone = 'professional', length = 'medium', audience, keywords, includeOutline, includeSEO } = request;

    // Base prompt templates for different content types
    const templates = {
      POST: 'Create an engaging blog post',
      ARTICLE: 'Write a comprehensive article',
      NEWSLETTER: 'Compose a newsletter section',
      PAGE: 'Create webpage content'
    };

    // Length specifications
    const lengthSpecs = {
      short: '300-500 words',
      medium: '800-1200 words', 
      long: '1500-2500 words'
    };

    // Tone descriptions
    const toneDescriptions = {
      professional: 'professional and authoritative',
      casual: 'casual and approachable',
      friendly: 'warm and friendly',
      authoritative: 'expert and trustworthy',
      conversational: 'conversational and engaging'
    };

    let prompt = `${templates[type]} about "${topic}".

REQUIREMENTS:
- Tone: ${toneDescriptions[tone]}
- Length: ${lengthSpecs[length]}
- Target audience: ${audience || 'general audience'}`;

    if (keywords && keywords.length > 0) {
      prompt += `\n- Include these keywords naturally: ${keywords.join(', ')}`;
    }

    if (includeOutline) {
      prompt += `\n- Provide a content outline`;
    }

    if (includeSEO) {
      prompt += `\n- Include SEO-optimized title and meta description`;
    }

    prompt += `

FORMAT YOUR RESPONSE AS JSON:
{
  "title": "Compelling title for the content",
  "content": "Full content in HTML format with proper headings and paragraphs",
  "excerpt": "Brief 2-3 sentence summary",
  ${includeSEO ? '"seoTitle": "SEO-optimized title (60 chars max)",\n  "seoDescription": "SEO meta description (160 chars max)",' : ''}
  "suggestedTags": ["tag1", "tag2", "tag3"],
  ${includeOutline ? '"outline": ["Section 1", "Section 2", "Section 3"],' : ''}
  "estimatedReadingTime": 5
}

CONTENT GUIDELINES:
- Use proper HTML formatting (<h2>, <h3>, <p>, <ul>, <ol>, <strong>, <em>)
- Include engaging subheadings
- Write in a ${toneDescriptions[tone]} tone
- Make it valuable and actionable for readers
- Ensure content flows naturally and is well-structured
- Include a strong introduction and conclusion`;

    return prompt;
  }

  private parseResponse(text: string, request: GenerationRequest): GenerationResponse {
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parsed = JSON.parse(cleanText);
      
      // Calculate word count
      const wordCount = this.calculateWordCount(parsed.content);
      
      // Calculate reading time (average 200 words per minute)
      const readingTime = Math.ceil(wordCount / 200);

      return {
        title: parsed.title,
        content: parsed.content,
        excerpt: parsed.excerpt,
        seoTitle: parsed.seoTitle,
        seoDescription: parsed.seoDescription,
        suggestedTags: parsed.suggestedTags || [],
        outline: parsed.outline,
        wordCount,
        readingTime
      };
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
      console.log('Raw response:', text);
      
      // Fallback: create a basic response from the raw text
      return this.createFallbackResponse(text, request);
    }
  }

  private createFallbackResponse(text: string, request: GenerationRequest): GenerationResponse {
    const wordCount = this.calculateWordCount(text);
    const readingTime = Math.ceil(wordCount / 200);
    
    return {
      title: `${request.type}: ${request.topic}`,
      content: `<p>${text.replace(/\n/g, '</p><p>')}</p>`,
      excerpt: text.substring(0, 200) + '...',
      suggestedTags: [request.topic.toLowerCase()],
      wordCount,
      readingTime
    };
  }

  private calculateWordCount(text: string): number {
    // Remove HTML tags and count words
    const plainText = text.replace(/<[^>]*>/g, '');
    return plainText.split(/\s+/).filter(word => word.length > 0).length;
  }

  // Generate content ideas based on topic
  async generateContentIdeas(topic: string, count: number = 5): Promise<string[]> {
    try {
      const prompt = `Generate ${count} creative and engaging content ideas related to "${topic}". 
      
      Return as a JSON array of strings:
      ["Idea 1", "Idea 2", "Idea 3", ...]
      
      Make each idea:
      - Specific and actionable
      - Engaging for readers
      - Unique and creative
      - Suitable for blog posts or articles`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      return JSON.parse(text);
    } catch (error) {
      console.error('❌ Failed to generate content ideas:', error);
      return [`How to get started with ${topic}`, `Best practices for ${topic}`, `Common mistakes in ${topic}`];
    }
  }

  // Improve existing content
  async improveContent(content: string, improvements: string[]): Promise<string> {
    try {
      const prompt = `Improve the following content based on these requirements:
      ${improvements.join(', ')}
      
      Original content:
      ${content}
      
      Return only the improved content in HTML format, maintaining the original structure but enhancing:
      - Clarity and readability
      - Engagement and flow
      - SEO optimization
      - Professional formatting`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('❌ Failed to improve content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Content improvement failed: ${errorMessage}`);
    }
  }

  // Generate SEO-optimized title variations
  async generateTitleVariations(topic: string, count: number = 5): Promise<string[]> {
    try {
      const prompt = `Generate ${count} SEO-optimized title variations for content about "${topic}".
      
      Return as a JSON array of strings:
      ["Title 1", "Title 2", "Title 3", ...]
      
      Make each title:
      - Under 60 characters
      - Engaging and click-worthy
      - Include relevant keywords
      - Different styles (how-to, list, question, etc.)`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      return JSON.parse(text);
    } catch (error) {
      console.error('❌ Failed to generate title variations:', error);
      return [`Ultimate Guide to ${topic}`, `How to Master ${topic}`, `${topic}: Complete Tutorial`];
    }
  }
}

export default new AIService();