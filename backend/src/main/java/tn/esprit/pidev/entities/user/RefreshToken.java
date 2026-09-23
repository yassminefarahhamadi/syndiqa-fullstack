package tn.esprit.pidev.entities.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "refresh_tokens")
public class RefreshToken {

    @Id
    private String id;

    @Indexed
    private String accountId;

    @Indexed(unique = true)
    private String tokenHash;

    private String deviceInfo;
    private String ipAddress;

    @Builder.Default
    private Instant issuedAt = Instant.now();

    private Instant expiresAt;

    private Instant revokedAt;
}

