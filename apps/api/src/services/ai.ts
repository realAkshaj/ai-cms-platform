// apps/api/src/services/ai.ts
// AI Content Generation Service using Google Gemini — with observability

import { GoogleGenerativeAI } from '@google/generative-ai';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { createLogger } from '../lib/logger';
import {
  contentGenerationDuration,
  contentQualityScore,
  geminiTokensUsed,
  generationErrorsTotal,
} from '../lib/metrics';

const log = createLogger('ai-service');
const tracer = trace.getTracer('ai-service');

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
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateContent(request: GenerationRequest): Promise<GenerationResponse> {
    const tone = request.tone || 'professional';
    const length = request.length || 'medium';

    return tracer.startActiveSpan('ai.generateContent', async (parentSpan) => {
      const timer = contentGenerationDuration.startTimer({
        type: request.type,
        tone,
        length,
      });

      parentSpan.setAttributes({
        'ai.content.type': request.type,
        'ai.content.topic': request.topic,
        'ai.content.tone': tone,
        'ai.content.length': length,
      });

      log.info({
        event: 'content_generation_started',
        contentType: request.type,
        topic: request.topic,
        tone,
        length,
      }, 'AI content generation started');

      try {
        const prompt = this.buildEnhancedPrompt(request);

        // Wrap Gemini API call in its own span
        const text = await tracer.startActiveSpan('ai.gemini.generateContent', async (geminiSpan) => {
          geminiSpan.setAttribute('ai.model', 'gemini-2.5-flash');

          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          const responseText = response.text();

          // Record token usage if available
          if (result.response.usageMetadata) {
            const usage = result.response.usageMetadata;
            geminiSpan.setAttributes({
              'ai.tokens.prompt': usage.promptTokenCount || 0,
              'ai.tokens.completion': usage.candidatesTokenCount || 0,
              'ai.tokens.total': usage.totalTokenCount || 0,
            });
            geminiTokensUsed.inc(
              { operation: 'generate' },
              usage.totalTokenCount || 0,
            );
          }

          geminiSpan.end();
          return responseText;
        });

        const parsedResponse = this.parseResponse(text, request);

        // Wrap quality assessment in its own span
        const qualityScore = tracer.startActiveSpan('ai.qualityAssessment', (qaSpan) => {
          const score = this.assessContentQuality(parsedResponse, request);
          qaSpan.setAttributes({
            'score.value': score,
            'score.passed': score >= 70,
            'content.type': request.type,
          });
          qaSpan.end();
          return score;
        });

        contentQualityScore.observe(
          { type: request.type, tone },
          qualityScore,
        );

        log.info({
          event: 'quality_score_computed',
          qualityScore,
          wordCount: parsedResponse.wordCount,
          contentType: request.type,
        }, 'Content quality score computed');

        timer({ status: 'success' });
        parentSpan.setAttributes({
          'ai.quality.score': qualityScore,
          'ai.content.wordCount': parsedResponse.wordCount,
        });
        parentSpan.setStatus({ code: SpanStatusCode.OK });
        parentSpan.end();

        log.info({
          event: 'content_generation_completed',
          qualityScore,
          wordCount: parsedResponse.wordCount,
          contentType: request.type,
        }, 'AI content generation completed');

        return {
          ...parsedResponse,
          qualityScore,
          researchSources: [],
        };
      } catch (error) {
        timer({ status: 'error' });
        generationErrorsTotal.inc({
          type: request.type,
          error_category: error instanceof Error && error.message.includes('quota')
            ? 'rate_limit'
            : 'generation_failure',
        });

        parentSpan.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
        parentSpan.recordException(error as Error);
        parentSpan.end();

        log.error({
          event: 'content_generation_failed',
          err: error,
          contentType: request.type,
          topic: request.topic,
        }, 'AI generation failed');

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`AI generation failed: ${errorMessage}`);
      }
    });
  }

  private buildEnhancedPrompt(request: GenerationRequest): string {
    const { type, topic, tone = 'professional', length = 'medium', audience, keywords, includeOutline, includeSEO } = request;

    const templates = {
      POST: 'Create an in-depth, well-researched blog post',
      ARTICLE: 'Write a comprehensive, expert-level article',
      NEWSLETTER: 'Compose an informative newsletter section',
      PAGE: 'Create detailed webpage content'
    };

    const lengthSpecs = {
      short: '400-600 words with focused, specific information',
      medium: '800-1200 words with detailed explanations and examples',
      long: '1500-2500 words with comprehensive coverage and analysis'
    };

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
      // Extract JSON from the response, handling various Gemini output formats:
      // 1. Raw JSON
      // 2. ```json ... ```
      // 3. Text before/after the JSON block
      let cleanText = text;

      // Try to extract JSON from a code block first
      const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (codeBlockMatch) {
        cleanText = codeBlockMatch[1].trim();
      } else {
        // No code block — try to extract the JSON object directly
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanText = jsonMatch[0];
        }
      }

      const parsed = JSON.parse(cleanText);

      const wordCount = this.calculateWordCount(parsed.content);
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
      log.error({ err: error, rawResponseLength: text.length }, 'Failed to parse AI response, using fallback');
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
    const plainText = text.replace(/<[^>]*>/g, '');
    return plainText.split(/\s+/).filter(word => word.length > 0).length;
  }

  private assessContentQuality(response: GenerationResponse, request: GenerationRequest): number {
    let score = 100;
    const { content } = response;
    const { topic } = request;

    const titlePhrase = topic.toLowerCase();
    const contentLower = content.toLowerCase();
    const titleRepeats = (contentLower.match(new RegExp(titlePhrase, 'g')) || []).length;

    if (titleRepeats > 5) {
      score -= 30;
      log.warn({ event: 'quality_issue_repetition', titleRepeats, topic }, 'Excessive topic repetition detected');
    }

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
      log.warn({ event: 'quality_issue_filler', fillerCount }, 'Generic filler phrases detected');
    }

    const expectedWordCount = {
      short: { min: 400, max: 600 },
      medium: { min: 800, max: 1200 },
      long: { min: 1500, max: 2500 }
    };

    const expected = expectedWordCount[request.length || 'medium'];
    if (response.wordCount < expected.min * 0.8) {
      score -= 15;
      log.warn({
        event: 'quality_issue_length',
        wordCount: response.wordCount,
        expectedMin: expected.min,
      }, 'Content shorter than expected');
    }

    return score;
  }

  async validateContentBeforeSaving(content: GenerationResponse, topic: string): Promise<boolean> {
    const qualityScore = this.assessContentQuality(content, { topic, type: 'ARTICLE' });

    if (qualityScore < 70) {
      log.warn({ qualityScore, topic }, 'Content quality too low — consider regenerating');
      return false;
    }

    return true;
  }

  async generateContentIdeas(topic: string, count: number = 5): Promise<string[]> {
    return tracer.startActiveSpan('ai.generateContentIdeas', async (span) => {
      span.setAttribute('ai.topic', topic);
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

        if (result.response.usageMetadata) {
          geminiTokensUsed.inc(
            { operation: 'ideas' },
            result.response.usageMetadata.totalTokenCount || 0,
          );
        }

        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return JSON.parse(text);
      } catch (error) {
        log.error({ err: error, topic }, 'Failed to generate content ideas');
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        span.end();
        return [
          `Technical Analysis of ${topic}`,
          `Performance Comparison: ${topic}`,
          `Expert Insights on ${topic}`
        ];
      }
    });
  }

  async improveContent(content: string, improvements: string[]): Promise<string> {
    return tracer.startActiveSpan('ai.improveContent', async (span) => {
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

        if (result.response.usageMetadata) {
          geminiTokensUsed.inc(
            { operation: 'improve' },
            result.response.usageMetadata.totalTokenCount || 0,
          );
        }

        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return response.text();
      } catch (error) {
        log.error({ err: error }, 'Failed to improve content');
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        span.end();
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Content improvement failed: ${errorMessage}`);
      }
    });
  }

  async generateTitleVariations(topic: string, count: number = 5): Promise<string[]> {
    return tracer.startActiveSpan('ai.generateTitleVariations', async (span) => {
      span.setAttribute('ai.topic', topic);
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

        if (result.response.usageMetadata) {
          geminiTokensUsed.inc(
            { operation: 'titles' },
            result.response.usageMetadata.totalTokenCount || 0,
          );
        }

        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return JSON.parse(text);
      } catch (error) {
        log.error({ err: error, topic }, 'Failed to generate title variations');
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        span.end();
        return [`Ultimate Guide to ${topic}`, `How to Master ${topic}`, `${topic}: Complete Tutorial`];
      }
    });
  }
}

export default new AIService();
