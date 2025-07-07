import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/register - Register new user and organization
router.post('/register', async (req: Request, res: Response) => {
  try {
    console.log('Registration attempt:', req.body);
    
    const { email, password, firstName, lastName, organizationName } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !organizationName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate organization slug
    const orgSlug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if organization slug exists and make it unique
    let finalSlug = orgSlug;
    let counter = 1;
    while (await prisma.organization.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${orgSlug}-${counter}`;
      counter++;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create organization and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: finalSlug
        }
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          organizationId: organization.id
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      return { user, organization };
    });

    // Generate JWT token
    const accessToken = generateToken({
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.user.organizationId
    });

    const responseData = {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        organizationId: result.user.organizationId,
        organization: result.user.organization
      },
      accessToken
    };

    res.status(201).json({
      success: true,
      data: responseData,
      message: 'User registered successfully'
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    console.log('Login attempt:', { email: req.body.email });
    
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user with organization
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId
    });

    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
        organization: user.organization
      },
      accessToken
    };

    res.json({
      success: true,
      data: responseData,
      message: 'Login successful'
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

export default router;