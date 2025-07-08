import { Router, Request, Response } from 'express';
import { ContentService } from '../services/content';
import { AuthRequest, authenticateToken } from '../middleware/auth';

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
  } catch (error) {
    console.error('❌ Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
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
  } catch (error: any) {
    console.error('💥 Error creating content:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Content with this slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create content',
      error: error.message
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
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
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
  } catch (error: any) {
    console.error('Error updating content:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Content with this slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update content'
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
  } catch (error) {
    console.error('Error publishing content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish content'
    });
  }
});

console.log('✅ Content routes setup complete!');

export default router;