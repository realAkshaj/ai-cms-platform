import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Get environment variables with validation
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (!JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET environment variable is required');
}

export interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  organizationName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      organization: {
        id: string;
        name: string;
        slug: string;
        plan: string;
      };
    };
    accessToken: string;
    refreshToken: string;
  };
}

class AuthService {
  // Generate JWT tokens
  generateTokens(userId: string, email: string, role: string, organizationId: string) {
    const payload = {
      userId,
      email,
      role,
      organizationId
    };

    // TypeScript now knows these are not undefined due to validation above
    const accessToken = jwt.sign(
      payload,
      JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      payload,
      JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate organization slug
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + randomBytes(4).toString('hex');
  }

  // Register new user and organization
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
      });

      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(data.password);

      // Create organization and user in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create organization
        const organization = await tx.organization.create({
          data: {
            name: data.organizationName || `${data.firstName}'s Organization`,
            slug: this.generateSlug(data.organizationName || `${data.firstName} org`),
            plan: 'FREE'
          }
        });

        // Create user
        const user = await tx.user.create({
          data: {
            email: data.email.toLowerCase(),
            firstName: data.firstName,
            lastName: data.lastName,
            password: hashedPassword,
            role: 'ADMIN', // First user in organization is admin
            organizationId: organization.id,
            emailVerified: false
          },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                plan: true
              }
            }
          }
        });

        return { user, organization };
      });

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(
        result.user.id,
        result.user.email,
        result.user.role,
        result.user.organizationId
      );

      // Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          userId: result.user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
            organization: result.user.organization
          },
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Failed to register user'
      };
    }
  }

  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      // Find user with organization
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
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

      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated'
        };
      }

      // Check if organization is active
      if (!user.organization.isActive) {
        return {
          success: false,
          message: 'Organization is deactivated'
        };
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(data.password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(
        user.id,
        user.email,
        user.role,
        user.organizationId
      );

      // Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organization: {
              id: user.organization.id,
              name: user.organization.name,
              slug: user.organization.slug,
              plan: user.organization.plan
            }
          },
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Failed to login'
      };
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET!) as any;

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: decoded.userId,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  plan: true
                }
              }
            }
          }
        }
      });

      if (!storedToken || !storedToken.user.isActive) {
        return {
          success: false,
          message: 'Invalid refresh token'
        };
      }

      // Generate new tokens
      const tokens = this.generateTokens(
        storedToken.user.id,
        storedToken.user.email,
        storedToken.user.role,
        storedToken.user.organizationId
      );

      // Store new refresh token and delete old one
      await prisma.$transaction([
        prisma.refreshToken.delete({
          where: { id: storedToken.id }
        }),
        prisma.refreshToken.create({
          data: {
            userId: storedToken.user.id,
            token: tokens.refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })
      ]);

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: {
            id: storedToken.user.id,
            email: storedToken.user.email,
            firstName: storedToken.user.firstName,
            lastName: storedToken.user.lastName,
            role: storedToken.user.role,
            organization: storedToken.user.organization
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Failed to refresh token'
      };
    }
  }

  // Logout user
  async logout(refreshToken: string): Promise<{ success: boolean; message: string }> {
    try {
      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });

      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Failed to logout'
      };
    }
  }
}

export const authService = new AuthService();