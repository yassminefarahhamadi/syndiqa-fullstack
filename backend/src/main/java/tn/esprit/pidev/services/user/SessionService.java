package tn.esprit.pidev.services.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.SessionDto;
import tn.esprit.pidev.entities.user.RefreshToken;
import tn.esprit.pidev.exception.NotFoundException;
import tn.esprit.pidev.exception.ForbiddenException;
import tn.esprit.pidev.repositories.user.RefreshTokenRepository;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Returns all active sessions for the calling account (without the token hash).
     */
    public List<SessionDto> getActiveSessions(String accountId) {
        return refreshTokenRepository.findByAccountIdAndRevokedAtIsNull(accountId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Revokes a specific session — can only revoke own sessions.
     */
    public void revokeSession(String accountId, String sessionId) {
        RefreshToken token = refreshTokenRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        if (!token.getAccountId().equals(accountId)) {
            throw new ForbiddenException("Cannot revoke another user's session");
        }

        if (token.getRevokedAt() == null) {
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.save(token);
        }
    }

    private SessionDto toDto(RefreshToken token) {
        return SessionDto.builder()
                .id(token.getId())
                .deviceInfo(token.getDeviceInfo())
                .ipAddress(token.getIpAddress())
                .issuedAt(token.getIssuedAt())
                .expiresAt(token.getExpiresAt())
                .build();
    }
}


