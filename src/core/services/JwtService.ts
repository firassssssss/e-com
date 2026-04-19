import { Service } from 'typedi';
import jwt, { SignOptions } from 'jsonwebtoken';

// It's good practice to load these from a config module, but process.env is direct
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'; // Default to 1 hour

export interface JwtPayload {
  userId: string;
  email: string;
  // Add iat, exp automatically by jwt.sign
}

@Service()
export class JwtService {
  constructor() {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set.');
    }
  }

  generateToken(payload: { id: string; email: string }): string {
    const jwtPayload: JwtPayload = {
      userId: payload.id,
      email: payload.email,
    };

    const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
    return jwt.sign(jwtPayload, JWT_SECRET!, signOptions);
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET!) as JwtPayload;
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  }

  sign(payload: Record<string, any>, secret: string, options: SignOptions): string {
    return jwt.sign(payload, secret, options);
  }
}
