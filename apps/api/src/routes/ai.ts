// apps/api/src/routes/ai.ts
import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

console.log('🤖 Loading AI routes...');

const router = Router();

// Lazy-load AI service to avoid crashing if GEMINI_API_KEY is not set
let aiService: any = null;
function getAIService() {
  if (!aiService) {
    try {
      aiService = require('../services/ai').default;
    } catch (error) {
      console.warn('⚠️ AI service not available:', error instanceof Error ? error.message : error);
    }
  }
  return aiService;
}

// GET /api/ai/status - Check AI service status (no auth required)
router.get('/status', async (req, res: Response) => {
  try {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    
    res.json({
      success: true,
      data: {
        aiEnabled: hasApiKey,
        provider: 'Google Gemini',
        model: 'gemini-1.5-flash',
        features: [
          'Content Generation',
          'Content Ideas',
          'Content Improvement', 
          'Title Generation'
        ],
        apiKeyConfigured: hasApiKey
      }
    });
  } catch (error) {
    console.error('❌ AI status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check AI status'
    });
  }
});

// GET /api/ai - Basic info endpoint
router.get('/', (req, res: Response) => {
  res.json({ 
    message: 'AI Content Generation API',
    version: '1.0.0',
    endpoints: [
      'GET /api/ai/status - Check AI service status',
      'POST /api/ai/generate - Generate content (auth required)',
      'POST /api/ai/ideas - Generate content ideas (auth required)',
      'POST /api/ai/titles - Generate title variations (auth required)',
      'POST /api/ai/improve - Improve existing content (auth required)'
    ]
  });
});

// POST /api/ai/test - Simple test endpoint with auth
router.post('/test', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'AI routes working! Authentication successful.',
      user: {
        id: req.user?.id,
        email: req.user?.email,
        organizationId: req.user?.organizationId,
        firstName: req.user?.firstName,
        lastName: req.user?.lastName
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ AI test error:', error);
    res.status(500).json({
      success: false,
      message: 'AI test failed'
    });
  }
});

// POST /api/ai/generate - Generate content using REAL AI (requires auth)
router.post('/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    console.log('🤖 AI Generate Request:', req.body);
    console.log('👤 User:', req.user?.email);

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Please add GEMINI_API_KEY to environment variables.'
      });
    }

    const {
      type = 'ARTICLE',
      topic,
      tone = 'professional',
      length = 'medium',
      audience,
      keywords,
      includeOutline = true,
      includeSEO = true
    } = req.body;

    // Validate required fields
    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    console.log('🎯 Generating REAL AI content for:', topic);

    // Use your REAL AI service instead of mock response
    const generationRequest = {
      type: type as 'POST' | 'ARTICLE' | 'NEWSLETTER' | 'PAGE',
      topic,
      tone: tone as 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational',
      length: length as 'short' | 'medium' | 'long',
      audience,
      keywords: keywords ? (Array.isArray(keywords) ? keywords : keywords.split(',').map((k: string) => k.trim())) : undefined,
      includeOutline,
      includeSEO
    };

    const ai = getAIService();
    if (!ai) {
      return res.status(503).json({ success: false, message: 'AI service not available' });
    }

    // Generate content using your enhanced AI service
    const aiResult = await ai.generateContent(generationRequest);

    console.log('✅ REAL AI content generated successfully');
    if (aiResult.qualityScore) {
      console.log('📊 Quality score:', aiResult.qualityScore);
    }

    // Validate content quality
    const isValid = await ai.validateContentBeforeSaving(aiResult, topic);

    if (!isValid && aiResult.qualityScore && aiResult.qualityScore < 70) {
      console.log('🔄 Content quality low, regenerating with enhanced prompt...');

      // Try again with more authoritative tone for better content
      const betterRequest = {
        ...generationRequest,
        tone: 'authoritative' as const
      };

      const betterResult = await ai.generateContent(betterRequest);
      
      console.log('🎯 Regenerated content with quality score:', betterResult.qualityScore);
      
      return res.json({
        success: true,
        data: betterResult,
        message: 'AI content generated successfully (regenerated for quality)',
        metadata: {
          qualityScore: betterResult.qualityScore,
          researchSources: betterResult.researchSources?.length || 0,
          regenerated: true
        }
      });
    }

    res.json({
      success: true,
      data: aiResult,
      message: 'AI content generated successfully',
      metadata: {
        qualityScore: aiResult.qualityScore,
        researchSources: aiResult.researchSources?.length || 0,
        regenerated: false
      }
    });

  } catch (error: unknown) {
    console.error('❌ AI generation error:', error);
    
    let message = 'Failed to generate AI content';
    let statusCode = 500;

    if (error instanceof Error) {
      message = error.message;
      
      // Handle specific AI service errors
      if (message.includes('API key') || message.includes('GEMINI_API_KEY')) {
        message = 'AI service configuration error';
        statusCode = 503; // Service Unavailable
      } else if (message.includes('quota') || message.includes('rate limit')) {
        message = 'AI service temporarily unavailable due to rate limits';
        statusCode = 429; // Too Many Requests
      }
    }

    res.status(statusCode).json({
      success: false,
      message: message,
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
});

// POST /api/ai/ideas - Generate content ideas using REAL AI (requires auth)
router.post('/ideas', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    console.log('💡 AI Ideas Request:', req.body);
    
    const { topic, count = 5 } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    const ai = getAIService();
    if (!ai) {
      return res.status(503).json({ success: false, message: 'AI service not available' });
    }

    const ideas = await ai.generateContentIdeas(topic, Math.min(count, 10));

    res.json({
      success: true,
      data: { 
        ideas,
        topic: topic,
        count: ideas.length
      },
      message: 'Content ideas generated successfully'
    });

  } catch (error: unknown) {
    console.error('❌ AI ideas generation error:', error);
    
    let message = 'Failed to generate content ideas';
    if (error instanceof Error) {
      message = error.message;
    }

    res.status(500).json({
      success: false,
      message: message
    });
  }
});

// POST /api/ai/titles - Generate title variations using REAL AI (requires auth)
router.post('/titles', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📝 AI Titles Request:', req.body);
    
    const { topic, count = 5 } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    const ai = getAIService();
    if (!ai) {
      return res.status(503).json({ success: false, message: 'AI service not available' });
    }

    const titles = await ai.generateTitleVariations(topic, Math.min(count, 10));

    res.json({
      success: true,
      data: { 
        titles,
        topic: topic,
        count: titles.length
      },
      message: 'Title variations generated successfully'
    });

  } catch (error: unknown) {
    console.error('❌ Title generation error:', error);
    
    let message = 'Failed to generate title variations';
    if (error instanceof Error) {
      message = error.message;
    }

    res.status(500).json({
      success: false,
      message: message
    });
  }
});

// POST /api/ai/improve - Improve existing content using REAL AI (requires auth)
router.post('/improve', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    console.log('✨ AI Improve Request:', req.body);
    
    const { content, improvements } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const improvementsList = improvements || [
      'Improve clarity and readability',
      'Enhance SEO optimization',
      'Add more specific examples',
      'Remove generic filler content'
    ];

    const ai = getAIService();
    if (!ai) {
      return res.status(503).json({ success: false, message: 'AI service not available' });
    }

    const improvedContent = await ai.improveContent(content, improvementsList);

    res.json({
      success: true,
      data: {
        originalContent: content,
        improvedContent,
        improvements: improvementsList
      },
      message: 'Content improved successfully'
    });

  } catch (error: unknown) {
    console.error('❌ Content improvement error:', error);
    
    let message = 'Failed to improve content';
    if (error instanceof Error) {
      message = error.message;
    }

    res.status(500).json({
      success: false,
      message: message
    });
  }
});

console.log('🤖 AI routes loaded successfully with REAL Gemini integration!');

export default router;