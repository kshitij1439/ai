// lib/rate-limiter.ts
interface RateLimitEntry {
    count: number;
    resetAt: number;
  }
  
  const rateLimitStore = new Map<string, RateLimitEntry>();
  
  // Cleanup old entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  
  export function checkRateLimit(
    identifier: string,
    maxRequests: number = 5,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);
  
    if (!entry || now > entry.resetAt) {
      // Create new entry
      const resetAt = now + windowMs;
      rateLimitStore.set(identifier, { count: 1, resetAt });
      return { allowed: true, remaining: maxRequests - 1, resetAt };
    }
  
    if (entry.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }
  
    // Increment count
    entry.count++;
    rateLimitStore.set(identifier, entry);
    return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
  }
  
  export function getRateLimitInfo(identifier: string): { count: number; resetAt: number } | null {
    return rateLimitStore.get(identifier) || null;
  }