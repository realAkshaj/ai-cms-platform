import { Request, Response, NextFunction } from 'express';

// Simple validation functions (without express-validator for now)
export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { email, firstName, lastName, password } = req.body;
  
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
  
  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  next();
};

export const validateRefreshToken = (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }
  
  next();
};