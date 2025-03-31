import NodeCache from 'node-cache';
import logger from './logger';

// A simple in-memory cache for the application
// This is a simple replacement for Redis

// Initialize cache with default TTL of 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

/**
 * Save data to cache with optional TTL
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in seconds (optional)
 */
export async function saveToCache<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
        cache.set(key, data, ttl ?? 3600);
        logger.debug({
            message: 'Data saved to cache',
            key,
            ttl: ttl || 3600
        });
    } catch (error) {
        logger.error({
            message: 'Failed to save data to cache',
            key,
            error: error instanceof Error ? error.message : String(error)
        });
    }
}

/**
 * Get data from cache
 * @param key Cache key
 * @returns Cached data or null if not found
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
    try {
        const data = cache.get<T>(key);
        if (data === undefined) {
            logger.debug({
                message: 'Cache miss',
                key
            });
            return null;
        }
        
        logger.debug({
            message: 'Cache hit',
            key
        });
        return data;
    } catch (error) {
        logger.error({
            message: 'Failed to get data from cache',
            key,
            error: error instanceof Error ? error.message : String(error)
        });
        return null;
    }
}

/**
 * Delete data from cache
 * @param key Cache key
 */
export async function deleteFromCache(key: string): Promise<void> {
    try {
        cache.del(key);
        logger.debug({
            message: 'Data deleted from cache',
            key
        });
    } catch (error) {
        logger.error({
            message: 'Failed to delete data from cache',
            key,
            error: error instanceof Error ? error.message : String(error)
        });
    }
}