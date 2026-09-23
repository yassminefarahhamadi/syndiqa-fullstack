package tn.esprit.pidev.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Async Configuration
 * 
 * Enables asynchronous method execution for cache warmup
 * and other background tasks
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Spring will automatically configure a default TaskExecutor
    // for @Async methods
}
