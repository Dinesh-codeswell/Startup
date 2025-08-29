/**
 * Resources Cache Service
 * Implements 30-minute caching for resources views to reduce API calls
 */

export interface CachedResourceViews {
  [resourceId: number]: number;
}

export interface CacheData {
  data: CachedResourceViews;
  timestamp: number;
  expiresAt: number;
}

class ResourcesCacheService {
  private readonly CACHE_KEY = 'resources_views_cache';
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  private refreshInterval: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  /**
   * Get cached resource views data
   * Returns cached data if valid, null if expired or not found
   */
  getCachedViews(): CachedResourceViews | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const cacheData: CacheData = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now < cacheData.expiresAt) {
        return cacheData.data;
      }

      // Cache expired, remove it
      this.clearCache();
      return null;
    } catch (error) {
      console.error('Error reading from cache:', error);
      this.clearCache();
      return null;
    }
  }

  /**
   * Store resource views data in cache
   */
  setCachedViews(data: CachedResourceViews): void {
    try {
      const now = Date.now();
      const cacheData: CacheData = {
        data,
        timestamp: now,
        expiresAt: now + this.CACHE_DURATION
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Check if cache exists and is valid
   */
  isCacheValid(): boolean {
    return this.getCachedViews() !== null;
  }

  /**
   * Get time remaining until cache expires (in milliseconds)
   */
  getTimeUntilExpiry(): number {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return 0;

      const cacheData: CacheData = JSON.parse(cached);
      const now = Date.now();
      return Math.max(0, cacheData.expiresAt - now);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Fetch fresh data from API and update cache
   */
  async refreshCache(resourceIds: number[]): Promise<CachedResourceViews> {
    if (this.isRefreshing) {
      // If already refreshing, return cached data or empty object
      return this.getCachedViews() || {};
    }

    this.isRefreshing = true;
    
    try {
      const results: CachedResourceViews = {};
      
      // Fetch view counts for all resources in parallel
      await Promise.all(
        resourceIds.map(async (resourceId) => {
          try {
            const res = await fetch(`/api/resources/${resourceId}/views`, { 
              method: "GET",
              cache: 'no-cache' // Ensure fresh data
            });
            const data = await res.json();
            results[resourceId] = data.viewCount || 2500;
          } catch (error) {
            console.error(`Error fetching views for resource ${resourceId}:`, error);
            results[resourceId] = 2500; // Fallback value
          }
        })
      );

      // Update cache with fresh data
      this.setCachedViews(results);
      return results;
    } catch (error) {
      console.error('Error refreshing cache:', error);
      // Return cached data if available, otherwise empty object
      return this.getCachedViews() || {};
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Start automatic background refresh
   */
  startBackgroundRefresh(resourceIds: number[]): void {
    // Clear any existing interval
    this.stopBackgroundRefresh();

    // Set up interval to refresh cache every 30 minutes
    this.refreshInterval = setInterval(async () => {
      console.log('Background refresh: Updating resources cache...');
      await this.refreshCache(resourceIds);
    }, this.CACHE_DURATION);
  }

  /**
   * Stop automatic background refresh
   */
  stopBackgroundRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Get cached data or fetch fresh data if cache is invalid
   */
  async getResourceViews(resourceIds: number[]): Promise<CachedResourceViews> {
    // Try to get cached data first
    const cachedData = this.getCachedViews();
    
    if (cachedData) {
      // Return cached data immediately
      return cachedData;
    }

    // No valid cache, fetch fresh data
    return await this.refreshCache(resourceIds);
  }

  /**
   * Force refresh cache (ignores current cache)
   */
  async forceRefresh(resourceIds: number[]): Promise<CachedResourceViews> {
    this.clearCache();
    return await this.refreshCache(resourceIds);
  }
}

// Export singleton instance
export const resourcesCache = new ResourcesCacheService();

// Export hook for React components
export function useResourcesCache() {
  return resourcesCache;
}