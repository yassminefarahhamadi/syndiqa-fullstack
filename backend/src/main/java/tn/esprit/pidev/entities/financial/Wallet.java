package tn.esprit.pidev.entities.financial;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Wallet — per-resident digital fund account.
 * Each resident has exactly one wallet linked to their account + org.
 * Funds can be added (top-up) or deducted (charge payment).
 */
@Document(collection = "wallets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Wallet implements Serializable {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;          // Account ID of the resident

    private String organizationId;

    @Builder.Default
    private Double balance = 0.0;

    @Builder.Default
    private List<WalletTransaction> transactions = new ArrayList<>();

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    /**
     * Embedded transaction log for audit trail.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalletTransaction {
        private String id;
        private TransactionType type;
        private Double amount;
        private Double balanceAfter;
        private String description;
        private String referenceId;   // chargeId or paymentId
        @Builder.Default
        private LocalDateTime timestamp = LocalDateTime.now();
    }

    public enum TransactionType {
        TOP_UP,          // Add funds
        CHARGE_PAYMENT,  // Pay a charge
        REFUND,          // Refund from cancelled charge
        SOLAR_CREDIT     // Auto credit from solar energy
    }
}
