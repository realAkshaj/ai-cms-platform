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
  researchSources?: string[];
  qualityScore?: number;
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

      const prompt = this.buildEnhancedPrompt(request);
      console.log('📝 Generated enhanced prompt');

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ AI generation complete, parsing response...');
      const parsedResponse = this.parseResponse(text, request);
      
      // Add quality assessment
      const qualityScore = this.assessContentQuality(parsedResponse, request);
      
      // Return response with quality score and empty research sources for now
      return {
        ...parsedResponse,
        qualityScore,
        researchSources: [] // Empty array for now, can be enhanced later
      };
    } catch (error) {
      console.error('❌ AI generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`AI generation failed: ${errorMessage}`);
    }
  }

  private buildEnhancedPrompt(request: GenerationRequest): string {
    const { type, topic, tone = 'professional', length = 'medium', audience, keywords, includeOutline, includeSEO } = request;

    // Enhanced templates with specific instructions
    const templates = {
      POST: 'Create an in-depth, well-researched blog post',
      ARTICLE: 'Write a comprehensive, expert-level article',
      NEWSLETTER: 'Compose an informative newsletter section',
      PAGE: 'Create detailed webpage content'
    };

    // Length specifications
    const lengthSpecs = {
      short: '400-600 words with focused, specific information',
      medium: '800-1200 words with detailed explanations and examples', 
      long: '1500-2500 words with comprehensive coverage and analysis'
    };

    // Tone descriptions
    const toneDescriptions = {
      professional: 'professional, authoritative, and expert-level',
      casual: 'casual, approachable, but still informative',
      friendly: 'warm, friendly, and encouraging',
      authoritative: 'expert, trustworthy, and definitive',
      conversational: 'conversational, engaging, and relatable'
    };

    let prompt = `${templates[type]} about "${topic}".

IMPORTANT CONTENT REQUIREMENTS:
- Write SPECIFIC, FACTUAL content about ${topic}
- Use REAL information, data, and examples
- Avoid generic filler phrases like "in today's digital landscape" or "comprehensive guide"
- Include actual details, facts, and actionable insights
- Make every paragraph valuable and informative
- Use specific terminology and concepts related to ${topic}

STYLE REQUIREMENTS:
- Tone: ${toneDescriptions[tone]}
- Length: ${lengthSpecs[length]}
- Target audience: ${audience || 'knowledgeable readers interested in the topic'}`;

    if (keywords && keywords.length > 0) {
      prompt += `\n- Naturally incorporate these keywords: ${keywords.join(', ')}`;
    }

    if (includeOutline) {
      prompt += `\n- Provide a detailed content outline`;
    }

    if (includeSEO) {
      prompt += `\n- Include SEO-optimized title and meta description`;
    }

    prompt += `

CONTENT QUALITY CHECKLIST:
✓ Specific facts and details about ${topic}
✓ Real examples and use cases
✓ Actionable information readers can use
✓ Avoid repetitive phrases or generic content
✓ Include technical details when appropriate
✓ Write with expertise and authority on the subject

FORMAT YOUR RESPONSE AS JSON:
{
  "title": "Specific, compelling title about ${topic}",
  "content": "Detailed content in HTML format with proper headings, paragraphs, and formatting",
  "excerpt": "Specific 2-3 sentence summary highlighting key points",
  ${includeSEO ? '"seoTitle": "SEO-optimized title (60 chars max)",\n  "seoDescription": "SEO meta description (160 chars max)",' : ''}
  "suggestedTags": ["specific", "relevant", "tags"],
  ${includeOutline ? '"outline": ["Specific Section 1", "Detailed Section 2", "Technical Section 3"],' : ''}
  "estimatedReadingTime": 5
}

CONTENT GUIDELINES:
- Use proper HTML formatting (<h2>, <h3>, <p>, <ul>, <ol>, <strong>, <em>)
- Create engaging, specific subheadings
- Write with authority and expertise
- Include real-world applications and examples
- Ensure content provides genuine value
- Structure content logically and comprehensively
- Make it actionable and informative for ${audience || 'readers'}

AVOID THESE COMMON ISSUES:
- Generic template-style content
- Repetitive phrases using the topic title
- Filler content without substance
- Vague generalizations
- Placeholder-style writing`;

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

  private assessContentQuality(response: GenerationResponse, request: GenerationRequest): number {
    let score = 100;
    const { content } = response;
    const { topic } = request;

    // Check for repetitive title usage
    const titlePhrase = topic.toLowerCase();
    const contentLower = content.toLowerCase();
    const titleRepeats = (contentLower.match(new RegExp(titlePhrase, 'g')) || []).length;
    
    if (titleRepeats > 5) {
      score -= 30; // Major penalty for excessive title repetition
      console.warn(`⚠️ Quality issue: Topic phrase repeated ${titleRepeats} times`);
    }

    // Check for generic filler phrases
    const fillerPhrases = [
      'in today\'s digital landscape',
      'comprehensive guide',
      'best practices',
      'industry best practices',
      'rapidly evolving',
      'increasingly important'
    ];
    
    const fillerCount = fillerPhrases.filter(phrase => 
      contentLower.includes(phrase.toLowerCase())
    ).length;
    
    if (fillerCount > 2) {
      score -= (fillerCount * 10);
      console.warn(`⚠️ Quality issue: ${fillerCount} generic filler phrases detected`);
    }

    // Check content length vs expected
    const expectedWordCount = {
      short: { min: 400, max: 600 },
      medium: { min: 800, max: 1200 },
      long: { min: 1500, max: 2500 }
    };
    
    const expected = expectedWordCount[request.length || 'medium'];
    if (response.wordCount < expected.min * 0.8) {
      score -= 15;
      console.warn(`⚠️ Quality issue: Content too short (${response.wordCount} words)`);
    }

    console.log(`📊 Content quality score: ${score}/100`);
    return score;
  }

  async validateContentBeforeSaving(content: GenerationResponse, topic: string): Promise<boolean> {
    const qualityScore = this.assessContentQuality(content, { topic, type: 'ARTICLE' });
    
    if (qualityScore < 70) {
      console.warn(`⚠️ Content quality too low (${qualityScore}/100) - consider regenerating`);
      return false;
    }
    
    return true;
  }

  // Generate content ideas based on topic
  async generateContentIdeas(topic: string, count: number = 5): Promise<string[]> {
    try {
      const prompt = `Generate ${count} specific, research-worthy content ideas related to "${topic}". 
      
      Return as a JSON array of strings:
      ["Specific Idea 1", "Detailed Idea 2", "Technical Idea 3", ...]
      
      Make each idea:
      - Specific and focused on particular aspects of ${topic}
      - Research-worthy with factual potential
      - Valuable for experts and beginners
      - Avoid generic "how-to" or "guide" titles
      - Include technical or detailed angles`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      return JSON.parse(text);
    } catch (error) {
      console.error('❌ Failed to generate content ideas:', error);
      return [
        `Technical Analysis of ${topic}`, 
        `Performance Comparison: ${topic}`, 
        `Expert Insights on ${topic}`
      ];
    }
  }

  // Improve existing content
  async improveContent(content: string, improvements: string[]): Promise<string> {
    try {
      const prompt = `Improve the following content to eliminate generic filler and make it more specific and valuable:

SPECIFIC IMPROVEMENTS NEEDED:
${improvements.join('\n')}

QUALITY REQUIREMENTS:
- Remove generic phrases and filler content
- Add specific facts, examples, and details
- Make every paragraph valuable and actionable
- Eliminate repetitive phrases
- Ensure professional, expert-level writing

Original content:
${content}

Return only the improved content in HTML format with enhanced specificity and value.`;

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