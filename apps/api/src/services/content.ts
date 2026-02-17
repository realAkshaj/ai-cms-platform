import { PrismaClient, ContentStatus, ContentType, Content } from '@prisma/client';

const prisma = new PrismaClient();

export interface ContentFilters {
  organizationId: string;
  status?: string;
  type?: string;
  search?: string;
  authorId?: string;
}

export interface ContentPagination {
  page: number;
  limit: number;
}

export interface ContentSorting {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface GetContentOptions {
  filters: ContentFilters;
  pagination: ContentPagination;
  sorting: ContentSorting;
}

export interface ContentData {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  status?: ContentStatus;
  type?: ContentType;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  authorId: string;
  organizationId: string;
}

export interface ContentStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  recentContent: Content[];
}

export class ContentService {
  // Generate unique slug from title
  private generateSlug(title: string, existingSlugs: string[] = []): string {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }

  // Simple type mapping - just use what's available
  private mapContentType(frontendType: string): ContentType {
    // Log available types for debugging
    console.log('Available ContentType enum values:', ContentType);
    
    // Use only the types that definitely exist in your schema
    switch (frontendType.toUpperCase()) {
      case 'POST':
        return ContentType.POST;
      case 'PAGE':
        return ContentType.PAGE;
      case 'ARTICLE':
        return ContentType.ARTICLE;
      case 'NEWSLETTER':
        return ContentType.NEWSLETTER;
      default:
        return ContentType.ARTICLE;
    }
  }

  // Create new content - simplified version
  async createContent(data: ContentData) {
    try {
      console.log('📝 Creating content with data:', data);
      
      // Generate slug if not provided
      if (!data.slug || data.slug.trim() === '') {
        const existingSlugs = await prisma.content.findMany({
          where: { organizationId: data.organizationId },
          select: { slug: true }
        }).then(results => results.map(r => r.slug));
        
        data.slug = this.generateSlug(data.title, existingSlugs);
      }

      // Map the content type
      const mappedType = data.type ? this.mapContentType(data.type.toString()) : ContentType.ARTICLE;
      console.log('🔄 Mapped type:', mappedType);

      const contentToCreate = {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || '',
        body: data.content,  // Map 'content' to 'body' field in database
        status: data.status || ContentStatus.DRAFT,
        type: mappedType,
        featuredImage: data.featuredImage || '',
        seoTitle: data.seoTitle || '',
        seoDescription: data.seoDescription || '',
        tags: data.tags || [],
        authorId: data.authorId,
        organizationId: data.organizationId,
        publishedAt: data.status === ContentStatus.PUBLISHED ? new Date() : null
      };

      console.log('💾 Saving content to database:', contentToCreate);

      const content = await prisma.content.create({
        data: contentToCreate,
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

      console.log('✅ Content created successfully:', content);
      return content;
    } catch (error) {
      console.error('❌ Error creating content:', error);
      throw error;
    }
  }

  // Get paginated content with filters and sorting
  async getContent(options: GetContentOptions) {
    const { filters, pagination, sorting } = options;
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organizationId: filters.organizationId,
    };

    if (filters.status) {
      where.status = filters.status.toUpperCase() as ContentStatus;
    }

    if (filters.type) {
      where.type = this.mapContentType(filters.type);
    }

    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { excerpt: { contains: filters.search, mode: 'insensitive' } },
        { body: { contains: filters.search, mode: 'insensitive' } },  // Use 'body' field
        { tags: { has: filters.search } }
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sorting.sortBy] = sorting.sortOrder;

    try {
      const [content, total] = await Promise.all([
        prisma.content.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy,
          skip: offset,
          take: limit
        }),
        prisma.content.count({ where })
      ]);

      return {
        content,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
  }

  // Get single content item by ID
  async getContentById(id: string, organizationId: string) {
    try {
      return await prisma.content.findFirst({
        where: {
          id,
          organizationId
        },
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
    } catch (error) {
      console.error('Error fetching content by ID:', error);
      throw error;
    }
  }

  // Update content
  async updateContent(id: string, data: Partial<ContentData>, organizationId: string) {
    try {
      const existingContent = await prisma.content.findFirst({
        where: { id, organizationId }
      });

      if (!existingContent) {
        return null;
      }

      const updateData: any = { ...data };
      
      // Map content field to body field for database
      if (data.content) {
        updateData.body = data.content;
        delete updateData.content;
      }

      // Handle type mapping
      if (data.type) {
        updateData.type = this.mapContentType(data.type.toString());
      }

      // Set publishedAt when publishing
      if (data.status === ContentStatus.PUBLISHED && existingContent.status !== ContentStatus.PUBLISHED) {
        updateData.publishedAt = new Date();
      }

      if (data.status && data.status !== ContentStatus.PUBLISHED) {
        updateData.publishedAt = null;
      }

      const content = await prisma.content.update({
        where: { id },
        data: updateData,
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

      return content;
    } catch (error) {
      console.error('Error updating content:', error);
      throw error;
    }
  }

  // Delete content
  async deleteContent(id: string, organizationId: string) {
    try {
      const existingContent = await prisma.content.findFirst({
        where: { id, organizationId }
      });

      if (!existingContent) {
        return false;
      }

      await prisma.content.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      throw error;
    }
  }

  // Publish content
  async publishContent(id: string, organizationId: string) {
    try {
      return await this.updateContent(id, { 
        status: ContentStatus.PUBLISHED
      }, organizationId);
    } catch (error) {
      console.error('Error publishing content:', error);
      throw error;
    }
  }

  // Unpublish content
  async unpublishContent(id: string, organizationId: string) {
    try {
      return await this.updateContent(id, { 
        status: ContentStatus.DRAFT
      }, organizationId);
    } catch (error) {
      console.error('Error unpublishing content:', error);
      throw error;
    }
  }

  // Get content statistics
  async getContentStats(organizationId: string): Promise<ContentStats> {
    try {
      const [
        total,
        published,
        draft,
        archived,
        recentContent
      ] = await Promise.all([
        prisma.content.count({ where: { organizationId } }),
        prisma.content.count({ where: { organizationId, status: ContentStatus.PUBLISHED } }),
        prisma.content.count({ where: { organizationId, status: ContentStatus.DRAFT } }),
        prisma.content.count({ where: { organizationId, status: ContentStatus.ARCHIVED } }),
        prisma.content.findMany({
          where: { organizationId },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ]);

      return {
        total,
        published,
        draft,
        archived,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        recentContent
      };
    } catch (error) {
      console.error('Error fetching content stats:', error);
      throw error;
    }
  }
}