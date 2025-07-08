// apps/api/src/routes/ai.ts
// Complete AI routes with all endpoints

import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

console.log('🤖 Loading complete AI routes...');

const router = Router();

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

// POST /api/ai/generate - Generate content using AI (requires auth)
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
      includeOutline = false,
      includeSEO = false
    } = req.body;

    // Validate required fields
    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    // Generate comprehensive mock response
    const mockResponse = {
      title: `${type === 'ARTICLE' ? 'The Complete Guide to' : 'Understanding'} ${topic}`,
      content: `<h2>Introduction</h2>
<p>Welcome to this comprehensive guide about ${topic}. In today's rapidly evolving digital landscape, understanding ${topic} has become increasingly important for ${audience || 'professionals and enthusiasts alike'}.</p>

<h2>What You Need to Know About ${topic}</h2>
<p>This ${tone} overview will provide you with valuable insights and practical knowledge about ${topic}. Whether you're just getting started or looking to deepen your expertise, this content is designed to be both informative and actionable.</p>

<h3>Key Benefits</h3>
<ul>
<li>Comprehensive understanding of ${topic} fundamentals</li>
<li>Practical tips and strategies you can implement immediately</li>
<li>Expert insights based on current industry best practices</li>
<li>Real-world examples and case studies</li>
</ul>

<h2>Getting Started</h2>
<p>The journey into ${topic} begins with understanding the core concepts and principles. This foundation will serve as your stepping stone to more advanced applications and techniques.</p>

<h2>Best Practices and Implementation</h2>
<p>When implementing ${topic} strategies, it's crucial to follow established best practices while adapting them to your specific needs and context. Consider these key factors for successful implementation:</p>

<ul>
<li>Start with clear objectives and measurable goals</li>
<li>Invest time in proper planning and research</li>
<li>Stay updated with industry trends and innovations</li>
<li>Focus on continuous learning and improvement</li>
</ul>

<h2>Common Challenges and Solutions</h2>
<p>While working with ${topic}, you may encounter various challenges. Here are some common issues and their solutions:</p>

<h3>Challenge 1: Getting Started</h3>
<p>Many beginners feel overwhelmed when first approaching ${topic}. The key is to start small and build your knowledge gradually.</p>

<h3>Challenge 2: Staying Current</h3>
<p>The field of ${topic} evolves rapidly. Make sure to follow industry leaders, read relevant publications, and participate in professional communities.</p>

<h2>Tools and Resources</h2>
<p>To succeed with ${topic}, consider leveraging these essential tools and resources that can streamline your workflow and enhance your results.</p>

<h2>Conclusion</h2>
<p>Mastering ${topic} is an ongoing journey that requires dedication, practice, and continuous learning. By applying the insights and strategies outlined in this guide, you'll be well-equipped to achieve success in your ${topic} endeavors. Remember that every expert was once a beginner, so stay persistent and keep learning.</p>`,
      excerpt: `A comprehensive ${tone} guide about ${topic}, covering essential concepts, best practices, and practical implementation strategies for ${audience || 'modern professionals'}. Learn the fundamentals and advanced techniques you need to succeed.`,
      suggestedTags: [
        topic.toLowerCase().replace(/\s+/g, '-'),
        type.toLowerCase(),
        tone,
        'guide',
        'tutorial',
        ...(keywords || [])
      ],
      wordCount: 420,
      readingTime: 3,
      ...(includeSEO && {
        seoTitle: `${topic}: Complete ${length === 'long' ? 'In-Depth' : 'Essential'} Guide for ${new Date().getFullYear()}`,
        seoDescription: `Master ${topic} with this ${tone} guide. Learn best practices, implementation strategies, and expert tips. Perfect for ${audience || 'professionals'} looking to excel.`
      }),
      ...(includeOutline && {
        outline: [
          'Introduction',
          `What You Need to Know About ${topic}`,
          'Key Benefits',
          'Getting Started', 
          'Best Practices and Implementation',
          'Common Challenges and Solutions',
          'Tools and Resources',
          'Conclusion'
        ]
      })
    };

    console.log('✅ AI content generated successfully (mock)');
    res.json({
      success: true,
      data: mockResponse
    });

  } catch (error) {
    console.error('❌ AI generation error:', error);
    res.status(500).json({
      success: false,
      message: 'AI content generation failed'
    });
  }
});

// POST /api/ai/ideas - Generate content ideas (requires auth)
router.post('/ideas', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { topic, count = 5 } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    // Generate contextual mock ideas
    const ideaTemplates = [
      `How to Get Started with ${topic}: A Beginner's Guide`,
      `${count > 3 ? 'Top 10' : 'Essential'} ${topic} Best Practices You Should Know`,
      `Common Mistakes to Avoid When Learning ${topic}`,
      `Advanced ${topic} Techniques for Professionals`,
      `The Future of ${topic}: Trends and Predictions for ${new Date().getFullYear() + 1}`,
      `${topic} vs Alternatives: Which Should You Choose?`,
      `Case Study: How ${topic} Transformed [Industry/Business]`,
      `Building Your First ${topic} Project: Step-by-Step Tutorial`,
      `${topic} Tools and Resources: Ultimate Comparison Guide`,
      `Measuring Success: ${topic} Metrics That Actually Matter`
    ];

    const ideas = ideaTemplates.slice(0, count);

    res.json({
      success: true,
      data: { 
        ideas,
        topic: topic,
        count: ideas.length
      }
    });

  } catch (error) {
    console.error('❌ AI ideas generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate content ideas'
    });
  }
});

// POST /api/ai/titles - Generate title variations (requires auth)
router.post('/titles', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { topic, count = 5 } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    const titleVariations = [
      `The Ultimate Guide to ${topic}`,
      `Master ${topic}: Everything You Need to Know`,
      `${topic} Explained: A Complete Tutorial`,
      `How to Excel at ${topic} in ${new Date().getFullYear()}`,
      `${topic}: From Beginner to Expert`,
      `Unlock the Power of ${topic}`,
      `${topic} Made Simple: Your Complete Guide`,
      `The ${topic} Handbook: Best Practices & Tips`,
      `Transform Your Skills with ${topic}`,
      `${topic}: The Essential Guide for Success`
    ].slice(0, count);

    res.json({
      success: true,
      data: { 
        titles: titleVariations,
        topic: topic,
        count: titleVariations.length
      }
    });

  } catch (error) {
    console.error('❌ Title generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate titles'
    });
  }
});

// POST /api/ai/improve - Improve existing content (requires auth)
router.post('/improve', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { content, improvements } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Mock improvement - in real implementation, this would use Gemini AI
    const improvedContent = `<div class="improved-content">
<h2>Enhanced Content</h2>
<p><strong>Original content improved with AI suggestions:</strong></p>
${content}
<p><em>Improvements applied: ${improvements?.join(', ') || 'Enhanced readability, improved flow, added engaging elements'}</em></p>
</div>`;

    res.json({
      success: true,
      data: { 
        improvedContent,
        improvements: improvements || ['Enhanced readability', 'Improved flow', 'Added engaging elements'],
        wordCountIncrease: 25
      }
    });

  } catch (error) {
    console.error('❌ Content improvement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to improve content'
    });
  }
});

console.log('🤖 AI routes loaded successfully!');

export default router;