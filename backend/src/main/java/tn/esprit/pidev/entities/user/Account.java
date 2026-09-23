package tn.esprit.pidev.entities.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import tn.esprit.pidev.entities.communityevents.AccountStatus;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "accounts")
public class Account {

    @Id
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    private String organizationId;

    @Indexed(unique = true)
    private String email;

    private String passwordHash;

    private AccountRole role;

    @Builder.Default
    private AccountStatus status = AccountStatus.PENDING;

    private String firstName;
    private String lastName;
    private String phone;

    private String fcmToken;

    @Builder.Default
    private String preferredLang = "fr";

    private String passwordResetToken;
    private Instant resetExpiresAt;

    private Instant lastLoginAt;

    @Builder.Default
    private Instant createdAt = Instant.now();
}

