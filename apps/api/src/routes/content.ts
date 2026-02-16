import { Router, Request, Response } from 'express';
import { ContentService } from '../services/content';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const contentService = new ContentService();
const prisma = new PrismaClient();

// Lazy-load AI service to avoid crashing if GEMINI_API_KEY is not set
let enhancedAIService: any = null;
function getAIService() {
  if (!enhancedAIService) {
    try {
      enhancedAIService = require('../services/ai').default;
    } catch (error) {
      console.warn('⚠️ AI service not available:', error instanceof Error ? error.message : error);
    }
  }
  return enhancedAIService;
}

console.log('📝 Content routes loaded!');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Test route to verify routes are working
router.get('/test', (req: AuthRequest, res: Response) => {
  console.log('🧪 Content test route hit!');
  res.json({
    success: true,
    message: 'Content routes are working!',
    user: req.user
  });
});

// ==========================================
// IMPORTANT: Static routes MUST come before /:id
// ==========================================

// GET /api/content/analytics/stats - Get content statistics
router.get('/analytics/stats', async (req: AuthRequest, res: Response) => {
  try {
    console.log('📊 GET /api/content/analytics/stats - Get content statistics');
    const organizationId = req.user!.organizationId;

    const [total, published, draft, archived] = await Promise.all([
      prisma.content.count({ where: { organizationId } }),
      prisma.content.count({ where: { organizationId, status: 'PUBLISHED' } }),
      prisma.content.count({ where: { organizationId, status: 'DRAFT' } }),
      prisma.content.count({ where: { organizationId, status: 'ARCHIVED' } })
    ]);

    const allContent = await prisma.content.findMany({
      where: { organizationId },
      select: {
        views: true,
        likes: true,
        shares: true,
      }
    });

    const totalViews = allContent.reduce((sum, c) => sum + (c.views || 0), 0);
    const totalLikes = allContent.reduce((sum, c) => sum + (c.likes || 0), 0);
    const totalShares = allContent.reduce((sum, c) => sum + (c.shares || 0), 0);

    const recentContent = await prisma.content.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const stats = {
      total,
      published,
      draft,
      archived,
      totalViews,
      totalLikes,
      totalShares,
      recentContent: recentContent.map(item => ({
        id: item.id,
        title: item.title,
        slug: item.slug || '',
        excerpt: item.excerpt || '',
        content: item.body,  // Map 'body' DB field back to 'content' for frontend
        status: item.status,
        type: item.type,
        featuredImage: item.featuredImage || '',
        seoTitle: item.seoTitle || '',
        seoDescription: item.seoDescription || '',
        tags: item.tags || [],
        views: item.views || 0,
        likes: item.likes || 0,
        shares: item.shares || 0,
        publishedAt: item.publishedAt || null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        author: item.author
      }))
    };

    console.log('✅ Content statistics calculated');

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching content stats:', error);
    res.json({
      success: true,
      data: {
        total: 0,
        published: 0,
        draft: 0,
        archived: 0,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        recentContent: []
      }
    });
  }
});

// GET /api/content/stats/simple - Simple content counts
router.get('/stats/simple', async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;

    const [total, published, draft] = await Promise.all([
      prisma.content.count({ where: { organizationId } }),
      prisma.content.count({ where: { organizationId, status: 'PUBLISHED' } }),
      prisma.content.count({ where: { organizationId, status: 'DRAFT' } })
    ]);

    res.json({ total, published, draft, archived: 0 });
  } catch (error) {
    console.error('❌ Simple stats error:', error);
    res.json({ total: 0, published: 0, draft: 0, archived: 0 });
  }
});

// POST /api/content/generate - AI Content Generation
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    console.log('🤖 POST /api/content/generate - AI content generation request');

    const aiService = getAIService();
    if (!aiService) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please configure GEMINI_API_KEY.'
      });
    }

    const {
      topic,
      type = 'ARTICLE',
      tone = 'professional',
      length = 'medium',
      audience,
      keywords,
      includeOutline = true,
      includeSEO = true,
      includeResearch = true
    } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required for AI content generation'
      });
    }

    const generationRequest = {
      type: type as 'POST' | 'ARTICLE' | 'NEWSLETTER' | 'PAGE',
      topic,
      tone: tone as 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational',
      length: length as 'short' | 'medium' | 'long',
      audience,
      keywords: keywords ? (Array.isArray(keywords) ? keywords : keywords.split(',').map((k: string) => k.trim())) : undefined,
      includeOutline,
      includeSEO,
      includeResearch
    };

    const aiResult = await aiService.generateContent(generationRequest);
    const isValid = await aiService.validateContentBeforeSaving(aiResult, topic);

    if (!isValid && aiResult.qualityScore && aiResult.qualityScore < 70) {
      const betterRequest = {
        ...generationRequest,
        includeResearch: true,
        tone: 'authoritative' as const
      };

      const betterResult = await aiService.generateContent(betterRequest);

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
    console.error('❌ Error generating AI content:', error);

    let message = 'Failed to generate AI content';
    let statusCode = 500;

    if (error instanceof Error) {
      message = error.message;
      if (message.includes('API key') || message.includes('GEMINI_API_KEY')) {
        message = 'AI service configuration error';
        statusCode = 503;
      } else if (message.includes('quota') || message.includes('rate limit')) {
        message = 'AI service temporarily unavailable due to rate limits';
        statusCode = 429;
      }
    }

    res.status(statusCode).json({
      success: false,
      message: message
    });
  }
});

// POST /api/content/ideas - Generate content ideas
router.post('/ideas', async (req: AuthRequest, res: Response) => {
  try {
    const aiService = getAIService();
    if (!aiService) {
      return res.status(503).json({ success: false, message: 'AI service not available' });
    }

    const { topic, count = 5 } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, message: 'Topic is required' });
    }

    const ideas = await aiService.generateContentIdeas(topic, Math.min(count, 10));

    res.json({
      success: true,
      data: { topic, ideas, count: ideas.length },
      message: 'Content ideas generated successfully'
    });
  } catch (error: unknown) {
    console.error('❌ Error generating content ideas:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate content ideas'
    });
  }
});

// POST /api/content/improve - Improve existing content
router.post('/improve', async (req: AuthRequest, res: Response) => {
  try {
    const aiService = getAIService();
    if (!aiService) {
      return res.status(503).json({ success: false, message: 'AI service not available' });
    }

    const { content, improvements } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const improvementsList = improvements || [
      'Improve clarity and readability',
      'Enhance SEO optimization',
      'Add more specific examples',
      'Remove generic filler content'
    ];

    const improvedContent = await aiService.improveContent(content, improvementsList);

    res.json({
      success: true,
      data: { originalContent: content, improvedContent, improvements: improvementsList },
      message: 'Content improved successfully'
    });
  } catch (error: unknown) {
    console.error('❌ Error improving content:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to improve content'
    });
  }
});

// POST /api/content/titles - Generate title variations
router.post('/titles', async (req: AuthRequest, res: Response) => {
  try {
    const aiService = getAIService();
    if (!aiService) {
      return res.status(503).json({ success: false, message: 'AI service not available' });
    }

    const { topic, count = 5 } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, message: 'Topic is required' });
    }

    const titles = await aiService.generateTitleVariations(topic, Math.min(count, 10));

    res.json({
      success: true,
      data: { topic, titles, count: titles.length },
      message: 'Title variations generated successfully'
    });
  } catch (error: unknown) {
    console.error('❌ Error generating titles:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate title variations'
    });
  }
});

// ==========================================
// CRUD routes (parameterized routes last)
// ==========================================

// GET /api/content - List content for user's organization
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;

    const {
      page = 1,
      limit = 10,
      status,
      type,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      organizationId,
      ...(status && { status: status as string }),
      ...(type && { type: type as string }),
      ...(search && { search: search as string })
    };

    const result = await contentService.getContent({
      filters,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      },
      sorting: {
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: unknown) {
    console.error('❌ Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch content'
    });
  }
});

// POST /api/content - Create new content
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;

    const contentData = {
      ...req.body,
      authorId: userId,
      organizationId
    };

    if (!contentData.title || !contentData.content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const content = await contentService.createContent(contentData);

    res.status(201).json({
      success: true,
      data: content,
      message: 'Content created successfully'
    });
  } catch (error: unknown) {
    console.error('❌ Error creating content:', error);

    let message = 'Failed to create content';
    let statusCode = 500;

    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2002') {
      message = 'Content with this slug already exists';
      statusCode = 400;
    } else if (error instanceof Error) {
      message = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message: message
    });
  }
});

// GET /api/content/:id - Get single content item
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const content = await contentService.getContentById(id, organizationId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error: unknown) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch content'
    });
  }
});

// PUT /api/content/:id - Update content
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const content = await contentService.updateContent(id, req.body, organizationId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content,
      message: 'Content updated successfully'
    });
  } catch (error: unknown) {
    console.error('Error updating content:', error);

    let message = 'Failed to update content';
    let statusCode = 500;

    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2002') {
      message = 'Content with this slug already exists';
      statusCode = 400;
    } else if (error instanceof Error) {
      message = error.message;
    }

    res.status(statusCode).json({ success: false, message });
  }
});

// DELETE /api/content/:id - Delete content
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const deleted = await contentService.deleteContent(id, organizationId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error: unknown) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete content'
    });
  }
});

// POST /api/content/:id/publish - Publish content
router.post('/:id/publish', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const content = await contentService.publishContent(id, organizationId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content,
      message: 'Content published successfully'
    });
  } catch (error: unknown) {
    console.error('Error publishing content:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to publish content'
    });
  }
});

console.log('✅ Content routes setup complete with AI features!');

export default router;
