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
@Document(collection = "email_verifications")
public class EmailVerification {

    @Id
    private String id;

    @Indexed
    private String accountId;

    @Indexed(unique = true)
    private String tokenHash;

    private Instant expiresAt;

    @Builder.Default
    private boolean verified = false;

    @Builder.Default
    private Instant createdAt = Instant.now();
}

