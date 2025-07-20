interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheService {
  private cache = new Map<string, CacheItem<unknown>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set a cache item with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    this.cache.set(key, item);
  }

  /**
   * Get a cache item if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific cache item
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache items
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired items from cache
   */
  clearExpired(): number {
    let cleared = 0;
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }
    
    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; expired: number } {
    const now = Date.now();
    let expired = 0;
    
    for (const item of this.cache.values()) {
      if (now - item.timestamp > item.ttl) {
        expired++;
      }
    }
    
    return {
      size: this.cache.size,
      expired
    };
  }

  /**
   * Generate cache key for analytics
   */
  generateAnalyticsKey(userId: string, options: { period?: string; startDate?: string; endDate?: string }): string {
    const { period = '1y', startDate, endDate } = options;
    return `analytics:${userId}:${period}:${startDate || 'all'}:${endDate || 'all'}`;
  }

  /**
   * Generate cache key for AI responses
   */
  generateAIKey(prompt: string, userId?: string): string {
    // Create a simple hash of the prompt for the key
    const hash = this.simpleHash(prompt);
    return `ai:${userId || 'global'}:${hash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Create a singleton instance
export const cacheService = new CacheService();

// Auto-clear expired items every 10 minutes
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    const cleared = cacheService.clearExpired();
    if (cleared > 0) {
      console.log(`[Cache] Cleared ${cleared} expired items`);
    }
  }, 10 * 60 * 1000);
} 