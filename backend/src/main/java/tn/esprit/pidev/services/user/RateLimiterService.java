package tn.esprit.pidev.services.user;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    // Login: 5 attempts per 15 minutes per IP
    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();

    // Forgot password: 3 attempts per hour per email
    private final Map<String, Bucket> forgotPasswordBuckets = new ConcurrentHashMap<>();

    public boolean tryConsumeLogin(String ip) {
        Bucket bucket = loginBuckets.computeIfAbsent(ip, k ->
                Bucket.builder()
                        .addLimit(Bandwidth.builder()
                                .capacity(5)
                                .refillGreedy(5, Duration.ofMinutes(15))
                                .build())
                        .build()
        );
        return bucket.tryConsume(1);
    }

    public boolean tryConsumeForgotPassword(String email) {
        Bucket bucket = forgotPasswordBuckets.computeIfAbsent(email.toLowerCase(), k ->
                Bucket.builder()
                        .addLimit(Bandwidth.builder()
                                .capacity(3)
                                .refillGreedy(3, Duration.ofHours(1))
                                .build())
                        .build()
        );
        return bucket.tryConsume(1);
    }
}

