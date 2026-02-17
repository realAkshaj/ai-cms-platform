import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/public/posts - List published content (no auth required)
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '12',
      search,
      type,
      tag,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: 'PUBLISHED',
      publishedAt: { not: null },
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { excerpt: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type as string;
    }

    if (tag) {
      where.tags = { has: tag as string };
    }

    const [posts, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          type: true,
          tags: true,
          featuredImage: true,
          publishedAt: true,
          views: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          organization: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.content.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching public posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
    });
  }
});

// GET /api/public/posts/:id - Get single published post (no auth required)
router.get('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await prisma.content.findFirst({
      where: {
        id,
        status: 'PUBLISHED',
        publishedAt: { not: null },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        body: true,
        type: true,
        tags: true,
        featuredImage: true,
        seoTitle: true,
        seoDescription: true,
        publishedAt: true,
        views: true,
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Increment views counter
    await prisma.content.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    res.json({
      success: true,
      data: { ...post, views: post.views + 1 },
    });
  } catch (error) {
    console.error('Error fetching public post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post',
    });
  }
});

export default router;
