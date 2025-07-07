import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    organizationId: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
  iat?: number;
  exp?: number;
}

export const authenticateToken = async (
  req: AuthRequest,
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

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Get user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
        message: 'User not found'
      });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);

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

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Optional: Middleware to check if user is admin/owner
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // You can add admin role checking logic here
    // For now, we'll assume the first user in an organization is admin
    const user = await prisma.user.findFirst({
      where: {
        organizationId: req.user.organizationId
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (!user || user.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};

// Utility function to generate JWT token
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign(payload, jwtSecret, {
    expiresIn: '24h'  // Fixed string value instead of environment variable
  });
};

// Utility function to verify token without middleware
export const verifyToken = (token: string): JWTPayload => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.verify(token, jwtSecret) as JWTPayload;
};