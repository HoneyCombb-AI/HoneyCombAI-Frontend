import redisClient from './redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  keyPrefix?: string;
}

export class RateLimiter {
  
  static async checkLimit(
    identifier: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    const client = redisClient.getClient();
    const { limit, windowSeconds, keyPrefix = 'rate_limit' } = options;
    const key = `${keyPrefix}:${identifier}`;
    
    try {
      // Use Upstash pipeline for atomic operations
      const pipeline = client.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, windowSeconds);
      pipeline.get(key);
      pipeline.ttl(key);
      
      const results = await pipeline.exec();
      
      if (!results) {
        throw new Error('Redis pipeline execution failed');
      }
      
      const count = parseInt(String(results[2] || '0'));
      const ttl = parseInt(String(results[3] || windowSeconds.toString()));
      
      if (count === 1) {
        await client.expire(key, windowSeconds);
      }
      
      const resetTime = Date.now() + (ttl * 1000);
      
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetTime
      };
      
    } catch (error) {
      console.error('Rate limiting error:', error);
      return {
        allowed: true,
        remaining: limit,
        resetTime: Date.now() + (windowSeconds * 1000)
      };
    }
  }
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // Global API limits
  globalPerIP: (ip: string) => 
    RateLimiter.checkLimit(ip, {
      limit: 1000,
      windowSeconds: 3600, // 1 hour
      keyPrefix: 'global_ip'
    }),

  // Authentication limits
  authPerIP: (ip: string) =>
    RateLimiter.checkLimit(ip, {
      limit: 5,
      windowSeconds: 900, // 15 minutes
      keyPrefix: 'auth_ip'
    }),

  // Expensive operations
  enrichmentPerUser: (userId: string) =>
    RateLimiter.checkLimit(userId, {
      limit: 10,
      windowSeconds: 3600, // 1 hour
      keyPrefix: 'enrichment_user'
    }),

  // Bulk operations
  bulkImportPerUser: (userId: string) =>
    RateLimiter.checkLimit(userId, {
      limit: 5,
      windowSeconds: 3600, // 1 hour
      keyPrefix: 'bulk_import_user'
    }),

  // Create operations
  createPerUser: (userId: string) =>
    RateLimiter.checkLimit(userId, {
      limit: 50,
      windowSeconds: 3600, // 1 hour
      keyPrefix: 'create_user'
    }),

  // Organization operations
  organizationPerUser: (userId: string) =>
    RateLimiter.checkLimit(userId, {
      limit: 30,
      windowSeconds: 3600, // 1 hour
      keyPrefix: 'org_user'
    }),

  // Join organization (prevent brute force)
  joinOrgPerUser: (userId: string) =>
    RateLimiter.checkLimit(userId, {
      limit: 5,
      windowSeconds: 1800, // 30 minutes
      keyPrefix: 'join_org_user'
    }),

  // CSV export operations
  csvExportPerUser: (userId: string) =>
    RateLimiter.checkLimit(userId, {
      limit: 10,
      windowSeconds: 3600, // 1 hour
      keyPrefix: 'csv_export_user'
    }),

  // List operations
  listPerUser: (userId: string) =>
    RateLimiter.checkLimit(userId, {
      limit: 60,
      windowSeconds: 3600, // 1 hour
      keyPrefix: 'list_user'
    }),

  // Detailed view operations
  detailViewPerUser: (userId: string) =>
    RateLimiter.checkLimit(userId, {
      limit: 500,
      windowSeconds: 3600, // 1 hour
      keyPrefix: 'detail_view_user'
    }),

  // Onboarding operations
  onboardingPerUser: (userId: string) =>
    RateLimiter.checkLimit(userId, {
      limit: 15,
      windowSeconds: 3600, // 1 hour
      keyPrefix: 'onboarding_user'
    }),

  // Support message operations
  supportPerIP: (ip: string) =>
    RateLimiter.checkLimit(ip, {
      limit: 2,
      windowSeconds: 3600, // 1 hour
      keyPrefix: 'support_ip'
    }),

  // AI draft generation
  aiDraftPerUser: (userId: string) =>
    RateLimiter.checkLimit(userId, {
      limit: 5,
      windowSeconds: 3600, // 1 hour
      keyPrefix: 'ai_draft_user'
    }),

  // Delete operations
  deletePerUser: (userId: string) =>
    RateLimiter.checkLimit(userId, {
      limit: 15,
      windowSeconds: 3600, // 1 hour
      keyPrefix: 'delete_user'
    }),

    TANPerUser: (userId: string) =>
      RateLimiter.checkLimit(userId, {
        limit: 200,
        windowSeconds: 3600, // 1 hour
        keyPrefix: 'create_user'
      }),
};


export function getRealIP(request: Request): string {
  // Try to get real IP from common headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  
  if (cfIP) return cfIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return 'unknown';
}
