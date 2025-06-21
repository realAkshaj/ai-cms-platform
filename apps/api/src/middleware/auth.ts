import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get JWT secret with validation
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

const JWT_SECRET: string = getRequiredEnvVar('JWT_SECRET');

// Extend Request interface to include user and organization
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        organizationId: string;
      };
      organization?: {
        id: string;
        name: string;
        slug: string;
        plan: string;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
  iat: number;
  exp: number;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access token required' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            isActive: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found or inactive' 
      });
    }

    if (!user.organization.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Organization is inactive' 
      });
    }

    // Attach user and organization to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    };

    req.organization = {
      id: user.organization.id,
      name: user.organization.name,
      slug: user.organization.slug,
      plan: user.organization.plan
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};