package tn.esprit.pidev.services.user;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.user.Account;
import tn.esprit.pidev.entities.user.RefreshToken;
import tn.esprit.pidev.exception.UnauthorizedException;
import tn.esprit.pidev.repositories.user.RefreshTokenRepository;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HexFormat;
import java.util.List;

@Service
@Slf4j
public class TokenService {

    private static final int MAX_SESSIONS = 5;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final SecretKey signingKey;
    private final long accessExpiryMs;
    private final long refreshExpiryDays;

    public TokenService(
            RefreshTokenRepository refreshTokenRepository,
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.access-expiry-ms}") long accessExpiryMs,
            @Value("${app.jwt.refresh-expiry-days}") long refreshExpiryDays) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.accessExpiryMs = accessExpiryMs;
        this.refreshExpiryDays = refreshExpiryDays;
    }

    // ═══════════════════════════════════════════════
    //              ACCESS TOKEN (JWT)
    // ═══════════════════════════════════════════════

    public String generateAccessToken(Account account) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(account.getId())
                .claim("organizationId", account.getOrganizationId())
                .claim("role", account.getRole().name())
                .claim("status", account.getStatus().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessExpiryMs)))
                .signWith(signingKey)
                .compact();
    }

    public Claims parseAccessToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new UnauthorizedException("Invalid or expired token");
        }
    }

    // ═══════════════════════════════════════════════
    //            REFRESH TOKEN LIFECYCLE
    // ═══════════════════════════════════════════════

    /**
     * Creates a new refresh token for the given account.
     * Enforces the max-sessions cap by evicting the oldest session.
     *
     * @return the raw refresh token (to be set as cookie)
     */
    public String createRefreshToken(String accountId, String deviceInfo, String ip) {
        // Enforce session cap
        long activeCount = refreshTokenRepository.countByAccountIdAndRevokedAtIsNull(accountId);
        if (activeCount >= MAX_SESSIONS) {
            evictOldestSession(accountId);
        }

        // Generate 64-byte random hex token
        byte[] randomBytes = new byte[64];
        SECURE_RANDOM.nextBytes(randomBytes);
        String rawToken = HexFormat.of().formatHex(randomBytes);

        // Store only the SHA-256 hash
        String tokenHash = sha256(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .accountId(accountId)
                .tokenHash(tokenHash)
                .deviceInfo(deviceInfo)
                .ipAddress(ip)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plus(refreshExpiryDays, ChronoUnit.DAYS))
                .build();

        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    /**
     * Rotates a refresh token: validates the old, revokes it, issues a new one.
     * Implements reuse detection — if a revoked token is presented, ALL sessions
     * for that account are revoked (compromise scenario).
     *
     * @return Object[] { accessToken (String), rawNewRefreshToken (String), accountId (String) }
     */
    public Object[] rotateRefreshToken(String rawOldToken, String deviceInfo, String ip) {
        String oldHash = sha256(rawOldToken);

        // First check if this token exists at all
        RefreshToken existing = refreshTokenRepository.findByTokenHash(oldHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        // REUSE DETECTION: if already revoked, this is a compromise
        if (existing.getRevokedAt() != null) {
            log.warn("SECURITY: Refresh token reuse detected for account {}. Revoking all sessions.",
                    existing.getAccountId());
            revokeAllForAccount(existing.getAccountId());
            throw new UnauthorizedException("Token reuse detected — all sessions revoked");
        }

        // Check expiry
        if (existing.getExpiresAt().isBefore(Instant.now())) {
            existing.setRevokedAt(Instant.now());
            refreshTokenRepository.save(existing);
            throw new UnauthorizedException("Refresh token expired");
        }

        // Revoke old token
        existing.setRevokedAt(Instant.now());
        refreshTokenRepository.save(existing);

        // Issue new refresh token
        String newRawToken = createRefreshToken(existing.getAccountId(), deviceInfo, ip);

        return new Object[]{existing.getAccountId(), newRawToken};
    }

    public void revokeToken(String rawToken) {
        String hash = sha256(rawToken);
        refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(hash).ifPresent(token -> {
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.save(token);
        });
    }

    public void revokeAllForAccount(String accountId) {
        List<RefreshToken> tokens = refreshTokenRepository.findByAccountIdAndRevokedAtIsNull(accountId);
        Instant now = Instant.now();
        tokens.forEach(token -> {
            token.setRevokedAt(now);
            refreshTokenRepository.save(token);
        });
    }

    public void revokeSessionById(String sessionId, String accountId) {
        RefreshToken token = refreshTokenRepository.findById(sessionId)
                .orElseThrow(() -> new UnauthorizedException("Session not found"));

        if (!token.getAccountId().equals(accountId)) {
            throw new UnauthorizedException("Cannot revoke another user's session");
        }

        if (token.getRevokedAt() == null) {
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.save(token);
        }
    }

    // ═══════════════════════════════════════════════
    //                   HELPERS
    // ═══════════════════════════════════════════════

    public static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    /**
     * Generates a cryptographically random hex token of the specified byte length.
     */
    public static String generateRandomToken(int byteLength) {
        byte[] bytes = new byte[byteLength];
        SECURE_RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private void evictOldestSession(String accountId) {
        List<RefreshToken> sessions = refreshTokenRepository.findByAccountIdAndRevokedAtIsNull(
                accountId, Sort.by(Sort.Direction.ASC, "issuedAt"));
        if (!sessions.isEmpty()) {
            RefreshToken oldest = sessions.get(0);
            oldest.setRevokedAt(Instant.now());
            refreshTokenRepository.save(oldest);
        }
    }
}


