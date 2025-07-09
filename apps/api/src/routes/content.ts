import { Router, Request, Response } from 'express';
import { ContentService } from '../services/content';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import enhancedAIService from '../services/ai'; // Import the enhanced AI service

const router = Router();
const contentService = new ContentService();

console.log('📝 Content routes loaded!'); // Debug log

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

// POST /api/content/generate - AI Content Generation
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    console.log('🤖 POST /api/content/generate - AI content generation request');
    console.log('👤 User:', req.user);
    console.log('📄 Request body:', req.body);

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

    // Validate required fields
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

    console.log('🎯 Generating enhanced content with request:', generationRequest);

    // Generate content using enhanced AI service
    const aiResult = await enhancedAIService.generateContent(generationRequest);

    console.log('✅ AI content generated successfully');
    console.log('📊 Quality score:', aiResult.qualityScore);

    // Validate content quality before returning
    const isValid = await enhancedAIService.validateContentBeforeSaving(aiResult, topic);

    if (!isValid && aiResult.qualityScore && aiResult.qualityScore < 70) {
      console.log('🔄 Content quality low, regenerating with stricter parameters...');
      
      // Try again with enhanced research
      const betterRequest = {
        ...generationRequest,
        includeResearch: true,
        tone: 'authoritative' as const // Use more authoritative tone for better content
      };
      
      const betterResult = await enhancedAIService.generateContent(betterRequest);
      
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
    console.error('❌ Error generating AI content:', error);
    
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

// POST /api/content/ideas - Generate content ideas
router.post('/ideas', async (req: AuthRequest, res: Response) => {
  try {
    console.log('💡 POST /api/content/ideas - Generate content ideas');
    
    const { topic, count = 5 } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required for content idea generation'
      });
    }

    const ideas = await enhancedAIService.generateContentIdeas(topic, Math.min(count, 10)); // Limit to 10 max

    res.json({
      success: true,
      data: {
        topic,
        ideas,
        count: ideas.length
      },
      message: 'Content ideas generated successfully'
    });

  } catch (error: unknown) {
    console.error('❌ Error generating content ideas:', error);
    
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

// POST /api/content/improve - Improve existing content
router.post('/improve', async (req: AuthRequest, res: Response) => {
  try {
    console.log('✨ POST /api/content/improve - Improve content');
    
    const { content, improvements } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required for improvement'
      });
    }

    const improvementsList = improvements || [
      'Improve clarity and readability',
      'Enhance SEO optimization',
      'Add more specific examples',
      'Remove generic filler content'
    ];

    const improvedContent = await enhancedAIService.improveContent(content, improvementsList);

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
    console.error('❌ Error improving content:', error);
    
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

// POST /api/content/titles - Generate title variations
router.post('/titles', async (req: AuthRequest, res: Response) => {
  try {
    console.log('📝 POST /api/content/titles - Generate title variations');
    
    const { topic, count = 5 } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required for title generation'
      });
    }

    const titles = await enhancedAIService.generateTitleVariations(topic, Math.min(count, 10));

    res.json({
      success: true,
      data: {
        topic,
        titles,
        count: titles.length
      },
      message: 'Title variations generated successfully'
    });

  } catch (error: unknown) {
    console.error('❌ Error generating titles:', error);
    
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

// GET /api/content - List content for user's organization
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    console.log('📋 GET /api/content - List content request received');
    console.log('👤 User:', req.user);
    
    const userId = req.user!.id;
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

    console.log('🔍 Query params:', { page, limit, status, type, search, sortBy, sortOrder });

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

    console.log('✅ Content fetched successfully:', result);

    res.json({
      success: true,
      data: result
    });
  } catch (error: unknown) {
    console.error('❌ Error fetching content:', error);
    let message = 'Failed to fetch content';
    if (error instanceof Error) {
        message = error.message;
    }
    res.status(500).json({
      success: false,
      message: message
    });
  }
});

// POST /api/content - Create new content
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    console.log('📝 POST /api/content - Create content request received');
    console.log('👤 User:', req.user);
    console.log('📄 Request body:', req.body);
    
    const userId = req.user!.id;
    const organizationId = req.user!.organizationId;
    
    const contentData = {
      ...req.body,
      authorId: userId,
      organizationId
    };

    console.log('💾 Content data to save:', contentData);

    // Validate required fields
    if (!contentData.title || !contentData.content) {
      console.log('❌ Validation failed: Missing title or content');
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const content = await contentService.createContent(contentData);

    console.log('🎉 Content created successfully:', content);

    res.status(201).json({
      success: true,
      data: content,
      message: 'Content created successfully'
    });
  } catch (error: unknown) {
    console.error('💥 Error creating content:', error);
    
    let message = 'Failed to create content';
    let statusCode = 500;

    // Check if it's a Prisma error for unique constraint
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
    console.log('📖 GET /api/content/:id - Get single content');
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
    let message = 'Failed to fetch content';
    if (error instanceof Error) {
        message = error.message;
    }
    res.status(500).json({
      success: false,
      message: message
    });
  }
});

// PUT /api/content/:id - Update content
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    console.log('✏️ PUT /api/content/:id - Update content');
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    const updateData = req.body;

    const content = await contentService.updateContent(id, updateData, organizationId);

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

    res.status(statusCode).json({
      success: false,
      message: message
    });
  }
});

// DELETE /api/content/:id - Delete content
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    console.log('🗑️ DELETE /api/content/:id - Delete content');
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
    let message = 'Failed to delete content';
    if (error instanceof Error) {
        message = error.message;
    }
    res.status(500).json({
      success: false,
      message: message
    });
  }
});

// POST /api/content/:id/publish - Publish content
router.post('/:id/publish', async (req: AuthRequest, res: Response) => {
  try {
    console.log('🚀 POST /api/content/:id/publish - Publish content');
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
    let message = 'Failed to publish content';
    if (error instanceof Error) {
        message = error.message;
    }
    res.status(500).json({
      success: false,
      message: message
    });
  }
});



router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    console.log('🤖 POST /api/content/generate - AI content generation request');
    
    const {
      topic,
      type = 'ARTICLE',
      tone = 'professional',
      length = 'medium',
      keywords,
      includeOutline = true,
      includeSEO = true
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
      keywords: keywords ? (Array.isArray(keywords) ? keywords : keywords.split(',').map((k: string) => k.trim())) : undefined,
      includeOutline,
      includeSEO
    };

    console.log('🎯 Generating enhanced content with request:', generationRequest);

    const aiResult = await enhancedAIService.generateContent(generationRequest);

    console.log('✅ AI content generated successfully');
    console.log('📊 Quality score:', aiResult.qualityScore);

    // Validate content quality
    const isValid = await enhancedAIService.validateContentBeforeSaving(aiResult, topic);

    res.json({
      success: true,
      data: aiResult,
      message: 'AI content generated successfully',
      metadata: {
        qualityScore: aiResult.qualityScore,
        qualityPassed: isValid,
        researchSources: aiResult.researchSources?.length || 0
      }
    });

  } catch (error: unknown) {
    console.error('❌ Error generating AI content:', error);
    
    let message = 'Failed to generate AI content';
    if (error instanceof Error) {
      message = error.message;
    }

    res.status(500).json({
      success: false,
      message: message
    });
  }
});

console.log('✅ Content routes setup complete with AI features!');

export default router;