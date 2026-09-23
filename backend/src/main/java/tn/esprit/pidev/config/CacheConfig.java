package tn.esprit.pidev.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

/**
 * Cache Configuration for Performance Optimization
 * 
 * Caches frequently accessed data to reduce database queries
 */
@Configuration
@EnableCaching
public class CacheConfig {

    // Cache names
    public static final String BUILDINGS_CACHE = "buildings";
    public static final String APARTMENTS_CACHE = "apartments";
    public static final String RESIDENTS_CACHE = "residents";
    public static final String CHARGES_CACHE = "charges";
    public static final String EXPENSES_CACHE = "expenses";
    public static final String PAYMENTS_CACHE = "payments";
    public static final String WALLETS_CACHE = "wallets";
    public static final String ORGANIZATIONS_CACHE = "organizations";

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager cacheManager = new SimpleCacheManager();
        cacheManager.setCaches(Arrays.asList(
            // Buildings cache - 10 minutes TTL
            new ConcurrentMapCache(BUILDINGS_CACHE),
            
            // Apartments cache - 10 minutes TTL
            new ConcurrentMapCache(APARTMENTS_CACHE),
            
            // Residents cache - 5 minutes TTL
            new ConcurrentMapCache(RESIDENTS_CACHE),
            
            // Charges cache - 2 minutes TTL (frequently updated)
            new ConcurrentMapCache(CHARGES_CACHE),
            
            // Expenses cache - 5 minutes TTL
            new ConcurrentMapCache(EXPENSES_CACHE),
            
            // Payments cache - 2 minutes TTL (frequently updated)
            new ConcurrentMapCache(PAYMENTS_CACHE),
            
            // Wallets cache - 1 minute TTL (very frequently updated)
            new ConcurrentMapCache(WALLETS_CACHE),
            
            // Organizations cache - 30 minutes TTL (rarely changes)
            new ConcurrentMapCache(ORGANIZATIONS_CACHE)
        ));
        return cacheManager;
    }
}
