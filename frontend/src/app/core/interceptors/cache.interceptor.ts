import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';

/**
 * HTTP Cache Interceptor for Performance Optimization
 * 
 * Caches GET requests for a configurable duration to reduce backend calls
 */

interface CacheEntry {
    response: HttpResponse<any>;
    timestamp: number;
}

// In-memory cache storage
const cache = new Map<string, CacheEntry>();

// Cache duration in milliseconds (default: 2 minutes)
const CACHE_DURATION = 2 * 60 * 1000;

// URLs that should be cached (GET requests only)
const CACHEABLE_PATTERNS = [
    '/api/buildings',
    '/charge',
    '/expense',
    '/admin/syndic/residents',
    '/wallet'
];

// URLs that should NOT be cached
const NON_CACHEABLE_PATTERNS = [
    '/auth/',
    '/login',
    '/register',
    '/logout'
];

/**
 * Check if a URL should be cached
 */
function isCacheable(url: string): boolean {
    // Don't cache non-cacheable patterns
    if (NON_CACHEABLE_PATTERNS.some(pattern => url.includes(pattern))) {
        return false;
    }
    
    // Cache if matches cacheable patterns
    return CACHEABLE_PATTERNS.some(pattern => url.includes(pattern));
}

/**
 * Get cached response if valid
 */
function getCachedResponse(url: string): HttpResponse<any> | null {
    const entry = cache.get(url);
    
    if (!entry) {
        return null;
    }
    
    // Check if cache is still valid
    const now = Date.now();
    if (now - entry.timestamp > CACHE_DURATION) {
        cache.delete(url);
        return null;
    }
    
    return entry.response.clone();
}

/**
 * Store response in cache
 */
function cacheResponse(url: string, response: HttpResponse<any>): void {
    cache.set(url, {
        response: response.clone(),
        timestamp: Date.now()
    });
}

/**
 * Clear cache entries for a specific URL pattern
 */
export function clearCache(urlPattern?: string): void {
    if (!urlPattern) {
        cache.clear();
        return;
    }
    
    const keysToDelete: string[] = [];
    cache.forEach((_, key) => {
        if (key.includes(urlPattern)) {
            keysToDelete.push(key);
        }
    });
    
    keysToDelete.forEach(key => cache.delete(key));
}

/**
 * HTTP Cache Interceptor
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        // For write operations (POST, PUT, DELETE), clear related cache
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
            // Clear cache for the resource being modified
            const urlParts = req.url.split('/');
            const resource = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1];
            clearCache(resource);
        }
        return next(req);
    }
    
    // Check if this URL should be cached
    if (!isCacheable(req.url)) {
        return next(req);
    }
    
    // Try to get cached response
    const cachedResponse = getCachedResponse(req.url);
    if (cachedResponse) {
        console.log(`[Cache HIT] ${req.url}`);
        return new Observable(observer => {
            observer.next(cachedResponse);
            observer.complete();
        });
    }
    
    // No cache, make the request and cache the response
    console.log(`[Cache MISS] ${req.url}`);
    return next(req).pipe(
        tap(event => {
            if (event instanceof HttpResponse) {
                cacheResponse(req.url, event);
            }
        })
    );
};

// Import Observable
import { Observable } from 'rxjs';
