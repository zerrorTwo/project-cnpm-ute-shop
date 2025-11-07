import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedException } from '@nestjs/common';

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare password
export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate access token (15 minutes)
export const generateAccessToken = (payload: any): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET || 'access_token_secret_key';
  return jwt.sign(payload, secret, { expiresIn: '15m' });
};

// Generate refresh token (7 days)
export const generateRefreshToken = (payload: any): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET || 'refresh_token_secret_key';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

// Verify access token
export const verifyAccessToken = (token: string): any => {
  try {
    const secret = process.env.ACCESS_TOKEN_SECRET || 'access_token_secret_key';
    return jwt.verify(token, secret);
  } catch (error) {
    throw new UnauthorizedException('Invalid or expired access token');
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): any => {
  try {
    const secret =
      process.env.REFRESH_TOKEN_SECRET || 'refresh_token_secret_key';
    return jwt.verify(token, secret);
  } catch (error) {
    throw new UnauthorizedException('Invalid or expired refresh token');
  }
};

// Extract token from header
export const extractTokenFromHeader = (request: any): string | undefined => {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
};
