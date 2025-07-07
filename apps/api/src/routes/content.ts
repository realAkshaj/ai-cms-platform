import { Router, Request, Response } from 'express';
import { ContentService } from '../services/content';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();
const contentService = new ContentService();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/content - List content for user's organization
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
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
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
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

    // Validate required fields
    if (!contentData.title || !contentData.body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }

    const content = await contentService.createContent(contentData);

    res.status(201).json({
      success: true,
      data: content,
      message: 'Content created successfully'
    });
  } catch (error) {
    console.error('Error creating content:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Content with this slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create content'
    });
  }
});

// PUT /api/content/:id - Update content
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
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
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete content'
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
  } catch (error) {
    console.error('Error publishing content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish content'
    });
  }
});

// POST /api/content/:id/unpublish - Unpublish content
router.post('/:id/unpublish', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const content = await contentService.unpublishContent(id, organizationId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content,
      message: 'Content unpublished successfully'
    });
  } catch (error) {
    console.error('Error unpublishing content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unpublish content'
    });
  }
});

// GET /api/content/analytics/stats - Get content analytics
router.get('/analytics/stats', async (req: AuthRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;
    const stats = await contentService.getContentStats(organizationId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching content stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content statistics'
    });
  }
});

export default router;