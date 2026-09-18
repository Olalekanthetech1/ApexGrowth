import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbService } from './services/dbService.js';
import { AdminUser } from '../src/types/index.js';

// Environment variable check for JWT Secret with safe fallback
const JWT_SECRET = process.env.ADMIN_JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ [Auth] ADMIN_JWT_SECRET not set in environment. Using fallback secret.');
  }
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || process.env.JWT_SECRET || 'apexgrowth_digital_secure_jwt_secret_2026_prod';

export interface AuthRequest extends Request {
  adminUser?: AdminUser;
}

export function generateToken(user: AdminUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    EFFECTIVE_JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, EFFECTIVE_JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function requireAdminAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token required.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session token.' });
    return;
  }

  try {
    const user = await dbService.findAdminById(payload.id);
    if (!user || !user.active) {
      res.status(401).json({ error: 'Unauthorized: Admin user not found or deactivated.' });
      return;
    }

    const { passwordHash: _, ...safeUser } = user;
    req.adminUser = {
      ...safeUser,
      role: safeUser.role as 'superadmin' | 'admin' | 'editor',
      createdAt: safeUser.createdAt.toISOString(),
      updatedAt: safeUser.updatedAt.toISOString(),
      lastLoginAt: safeUser.lastLoginAt ? safeUser.lastLoginAt.toISOString() : undefined,
    };
    next();
  } catch (err: any) {
    res.status(500).json({ error: 'Authentication service failure', details: err.message });
  }
}

/**
 * Server-Side Role Guard Middleware
 * Enforces least-privilege RBAC.
 * If user does not have an allowed role, returns 403 Forbidden.
 */
export function requireRole(allowedRoles: ('superadmin' | 'admin' | 'editor')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.adminUser.role)) {
      res.status(403).json({
        error: `Forbidden: Your role '${req.adminUser.role}' is not authorized to perform this operation. Allowed: [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
}

// In-memory rate limiter with documented upgrade path
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests = 10, windowMs = 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
      return;
    }

    entry.count++;
    next();
  };
}
