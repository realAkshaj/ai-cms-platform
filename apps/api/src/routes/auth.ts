import { Router, Request, Response } from 'express';
import { authService } from '../services/auth';

const router = Router();

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, password, organizationName } = req.body;

    // Simple validation
    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, firstName, lastName, and password are required'
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const result = await authService.register({
      email,
      firstName,
      lastName,
      password,
      organizationName
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Set refresh token as httpOnly cookie
    if (result.data?.refreshToken) {
      res.cookie('refreshToken', result.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    // Return user data and access token (don't include refresh token in body)
    const responseData = {
      ...result.data,
      refreshToken: undefined
    };

    res.status(201).json({
      success: true,
      message: result.message,
      data: responseData
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await authService.login({ email, password });

    if (!result.success) {
      return res.status(401).json(result);
    }

    // Set refresh token as httpOnly cookie
    if (result.data?.refreshToken) {
      res.cookie('refreshToken', result.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    // Return user data and access token (don't include refresh token in body)
    const responseData = {
      ...result.data,
      refreshToken: undefined
    };

    res.status(200).json({
      success: true,
      message: result.message,
      data: responseData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Profile endpoint (protected)
router.get('/profile', async (req: Request, res: Response) => {
  // We'll implement auth middleware later
  res.json({ message: 'Profile endpoint - requires authentication' });
});

export default router;