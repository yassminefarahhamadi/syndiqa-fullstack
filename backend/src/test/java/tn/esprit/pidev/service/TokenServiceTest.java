package tn.esprit.pidev.service;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import tn.esprit.pidev.entities.user.Account;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.entities.communityevents.AccountStatus;
import tn.esprit.pidev.entities.user.RefreshToken;
import tn.esprit.pidev.exception.UnauthorizedException;
import tn.esprit.pidev.repositories.user.RefreshTokenRepository;
import tn.esprit.pidev.services.user.TokenService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private TokenService tokenService;

    private Account testAccount;

    @BeforeEach
    void setUp() {
        tokenService = new TokenService(
                refreshTokenRepository,
                "c9a02b8e7f3d4a1e6b5c8d9f0a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7",
                900000, // 15 min
                30 // 30 days
        );

        testAccount = Account.builder()
                .id("acc-123")
                .organizationId("org-456")
                .role(AccountRole.SYNDIC_ADMIN)
                .status(AccountStatus.ACTIVE)
                .build();
    }

    // ═══════════════════════════════════════════════
    // ACCESS TOKEN TESTS
    // ═══════════════════════════════════════════════

    @Nested
    @DisplayName("Access Token")
    class AccessTokenTests {

        @Test
        @DisplayName("✅ Generate and parse access token")
        void generateAndParseAccessToken() {
            String token = tokenService.generateAccessToken(testAccount);

            assertNotNull(token);
            assertFalse(token.isBlank());

            Claims claims = tokenService.parseAccessToken(token);
            assertEquals("acc-123", claims.getSubject());
            assertEquals("org-456", claims.get("organizationId", String.class));
            assertEquals("SYNDIC_ADMIN", claims.get("role", String.class));
            assertEquals("ACTIVE", claims.get("status", String.class));
        }

        @Test
        @DisplayName("❌ Reject invalid access token")
        void rejectInvalidToken() {
            assertThrows(UnauthorizedException.class, () -> tokenService.parseAccessToken("invalid.jwt.token"));
        }

        @Test
        @DisplayName("❌ Reject tampered access token")
        void rejectTamperedToken() {
            String validToken = tokenService.generateAccessToken(testAccount);
            String tamperedToken = validToken.substring(0, validToken.length() - 5) + "XXXXX";

            assertThrows(UnauthorizedException.class, () -> tokenService.parseAccessToken(tamperedToken));
        }
    }

    // ═══════════════════════════════════════════════
    // REFRESH TOKEN TESTS
    // ═══════════════════════════════════════════════

    @Nested
    @DisplayName("Refresh Token")
    class RefreshTokenTests {

        @Test
        @DisplayName("✅ Create refresh token stores hash and returns raw")
        void createRefreshToken() {
            when(refreshTokenRepository.countByAccountIdAndRevokedAtIsNull("acc-123")).thenReturn(0L);
            when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

            String rawToken = tokenService.createRefreshToken("acc-123", "Mozilla/5.0", "127.0.0.1");

            assertNotNull(rawToken);
            assertEquals(128, rawToken.length()); // 64 bytes = 128 hex chars

            verify(refreshTokenRepository).save(argThat(rt -> {
                assertNotNull(rt.getTokenHash());
                assertNotEquals(rawToken, rt.getTokenHash()); // stored hash != raw token
                assertEquals("acc-123", rt.getAccountId());
                assertEquals("Mozilla/5.0", rt.getDeviceInfo());
                return true;
            }));
        }

        @Test
        @DisplayName("✅ Token rotation succeeds with valid token")
        void tokenRotationSuccess() {
            String rawOldToken = "a".repeat(128);
            String oldHash = TokenService.sha256(rawOldToken);

            RefreshToken existingToken = RefreshToken.builder()
                    .id("rt-1")
                    .accountId("acc-123")
                    .tokenHash(oldHash)
                    .expiresAt(Instant.now().plus(30, ChronoUnit.DAYS))
                    .revokedAt(null)
                    .build();

            when(refreshTokenRepository.findByTokenHash(oldHash)).thenReturn(Optional.of(existingToken));
            when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));
            when(refreshTokenRepository.countByAccountIdAndRevokedAtIsNull("acc-123")).thenReturn(1L);

            Object[] result = tokenService.rotateRefreshToken(rawOldToken, "Mozilla/5.0", "127.0.0.1");

            assertEquals("acc-123", result[0]);
            assertNotNull(result[1]); // new raw refresh token
            assertNotNull(existingToken.getRevokedAt()); // old token revoked
        }

        @Test
        @DisplayName("❌ Token reuse detection revokes ALL sessions")
        void tokenReuseDetection() {
            String rawOldToken = "b".repeat(128);
            String oldHash = TokenService.sha256(rawOldToken);

            RefreshToken revokedToken = RefreshToken.builder()
                    .id("rt-revoked")
                    .accountId("acc-123")
                    .tokenHash(oldHash)
                    .expiresAt(Instant.now().plus(30, ChronoUnit.DAYS))
                    .revokedAt(Instant.now().minus(1, ChronoUnit.HOURS)) // Already revoked!
                    .build();

            when(refreshTokenRepository.findByTokenHash(oldHash)).thenReturn(Optional.of(revokedToken));
            when(refreshTokenRepository.findByAccountIdAndRevokedAtIsNull("acc-123"))
                    .thenReturn(List.of()); // Called during revokeAll

            UnauthorizedException ex = assertThrows(UnauthorizedException.class,
                    () -> tokenService.rotateRefreshToken(rawOldToken, "Mozilla/5.0", "127.0.0.1"));

            assertTrue(ex.getMessage().contains("reuse"));
            verify(refreshTokenRepository).findByAccountIdAndRevokedAtIsNull("acc-123"); // all sessions revoked
        }

        @Test
        @DisplayName("✅ Session cap evicts oldest session on 6th login")
        void sessionCapEnforcement() {
            RefreshToken oldest = RefreshToken.builder()
                    .id("rt-oldest")
                    .accountId("acc-123")
                    .issuedAt(Instant.now().minus(30, ChronoUnit.DAYS))
                    .build();

            when(refreshTokenRepository.countByAccountIdAndRevokedAtIsNull("acc-123")).thenReturn(5L);
            when(refreshTokenRepository.findByAccountIdAndRevokedAtIsNull(
                    eq("acc-123"), any(Sort.class))).thenReturn(List.of(oldest));
            when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

            String rawToken = tokenService.createRefreshToken("acc-123", "Mozilla/5.0", "127.0.0.1");

            assertNotNull(rawToken);
            assertNotNull(oldest.getRevokedAt()); // oldest session was evicted

            // save called twice: once for eviction, once for new token
            verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
        }
    }

    // ═══════════════════════════════════════════════
    // SHA-256 HELPER TESTS
    // ═══════════════════════════════════════════════

    @Nested
    @DisplayName("Utilities")
    class UtilityTests {

        @Test
        @DisplayName("✅ SHA-256 produces consistent hash")
        void sha256Consistency() {
            String hash1 = TokenService.sha256("test-input");
            String hash2 = TokenService.sha256("test-input");
            assertEquals(hash1, hash2);
        }

        @Test
        @DisplayName("✅ SHA-256 produces different hash for different input")
        void sha256Uniqueness() {
            String hash1 = TokenService.sha256("input-a");
            String hash2 = TokenService.sha256("input-b");
            assertNotEquals(hash1, hash2);
        }

        @Test
        @DisplayName("✅ Random token generation produces unique tokens")
        void randomTokenUniqueness() {
            String token1 = TokenService.generateRandomToken(32);
            String token2 = TokenService.generateRandomToken(32);
            assertNotEquals(token1, token2);
            assertEquals(64, token1.length()); // 32 bytes = 64 hex chars
        }
    }
}

