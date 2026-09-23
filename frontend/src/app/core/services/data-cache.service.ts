import { Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

/**
 * Data Cache Service
 * 
 * Provides in-memory caching for frequently accessed data
 * to minimize API calls and improve application performance
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

@Injectable({
    providedIn: 'root'
})
export class DataCacheService {
    private cache = new Map<string, CacheEntry<any>>();
    
    // Signal to track cache statistics
    cacheStats = signal({
        hits: 0,
        misses: 0,
        size: 0
    });

    /**
     * Get data from cache or execute the provided function
     * 
     * @param key Cache key
     * @param dataFn Function that returns Observable with data
     * @param ttl Time to live in milliseconds (default: 5 minutes)
     */
    getOrFetch<T>(key: string, dataFn: () => Observable<T>, ttl: number = 5 * 60 * 1000): Observable<T> {
        const cached = this.get<T>(key);
        
        if (cached !== null) {
            // Cache hit
            this.updateStats('hit');
            console.log(`[Cache HIT] ${key}`);
            return of(cached);
        }

        // Cache miss - fetch data
        this.updateStats('miss');
        console.log(`[Cache MISS] ${key} - Fetching...`);
        
        return dataFn().pipe(
            tap(data => {
                this.set(key, data, ttl);
                console.log(`[Cache SET] ${key} (TTL: ${ttl}ms)`);
            })
        );
    }

    /**
     * Get data from cache if valid
     */
    private get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        // Check if cache entry is still valid
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            // Cache expired
            this.cache.delete(key);
            this.updateCacheSize();
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set data in cache
     */
    private set<T>(key: string, data: T, ttl: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
        this.updateCacheSize();
    }

    /**
     * Clear specific cache entry
     */
    clear(key: string): void {
        this.cache.delete(key);
        this.updateCacheSize();
        console.log(`[Cache CLEAR] ${key}`);
    }

    /**
     * Clear all cache entries matching a pattern
     */
    clearPattern(pattern: string): void {
        let cleared = 0;
        this.cache.forEach((_, key) => {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                cleared++;
            }
        });
        this.updateCacheSize();
        console.log(`[Cache CLEAR PATTERN] ${pattern} (${cleared} entries)`);
    }

    /**
     * Clear all cache
     */
    clearAll(): void {
        const size = this.cache.size;
        this.cache.clear();
        this.updateCacheSize();
        console.log(`[Cache CLEAR ALL] (${size} entries)`);
    }

    /**
     * Update cache statistics
     */
    private updateStats(type: 'hit' | 'miss'): void {
        const current = this.cacheStats();
        this.cacheStats.set({
            hits: type === 'hit' ? current.hits + 1 : current.hits,
            misses: type === 'miss' ? current.misses + 1 : current.misses,
            size: this.cache.size
        });
    }

    /**
     * Update cache size in stats
     */
    private updateCacheSize(): void {
        const current = this.cacheStats();
        this.cacheStats.set({
            ...current,
            size: this.cache.size
        });
    }

    /**
     * Get cache hit rate
     */
    getHitRate(): number {
        const stats = this.cacheStats();
        const total = stats.hits + stats.misses;
        return total === 0 ? 0 : (stats.hits / total) * 100;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            ...this.cacheStats(),
            hitRate: this.getHitRate().toFixed(2) + '%'
        };
    }
}
