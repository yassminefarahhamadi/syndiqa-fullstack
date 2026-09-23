package tn.esprit.pidev.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.stereotype.Component;

/**
 * MongoDB Index Configuration for Performance Optimization
 * 
 * Creates indexes on frequently queried fields to speed up database queries
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MongoIndexConfig {

    private final MongoTemplate mongoTemplate;

    @PostConstruct
    public void initIndexes() {
        log.info("Creating MongoDB indexes for performance optimization...");

        try {
            // ═══════════════════════════════════════════════
            //              BUILDING INDEXES
            // ═══════════════════════════════════════════════
            mongoTemplate.indexOps("buildings").ensureIndex(
                new Index().on("residenceId", Sort.Direction.ASC).named("idx_building_residence")
            );
            mongoTemplate.indexOps("buildings").ensureIndex(
                new Index().on("organizationId", Sort.Direction.ASC).named("idx_building_organization")
            );

            // ═══════════════════════════════════════════════
            //              APARTMENT INDEXES
            // ═══════════════════════════════════════════════
            mongoTemplate.indexOps("apartments").ensureIndex(
                new Index().on("buildingId", Sort.Direction.ASC).named("idx_apartment_building")
            );
            mongoTemplate.indexOps("apartments").ensureIndex(
                new Index().on("organizationId", Sort.Direction.ASC).named("idx_apartment_organization")
            );

            // ═══════════════════════════════════════════════
            //              CHARGE INDEXES
            // ═══════════════════════════════════════════════
            mongoTemplate.indexOps("charges").ensureIndex(
                new Index().on("organizationId", Sort.Direction.ASC).named("idx_charge_organization")
            );
            mongoTemplate.indexOps("charges").ensureIndex(
                new Index().on("userId", Sort.Direction.ASC).named("idx_charge_user")
            );
            mongoTemplate.indexOps("charges").ensureIndex(
                new Index().on("buildingId", Sort.Direction.ASC).named("idx_charge_building")
            );
            mongoTemplate.indexOps("charges").ensureIndex(
                new Index().on("status", Sort.Direction.ASC).named("idx_charge_status")
            );
            mongoTemplate.indexOps("charges").ensureIndex(
                new Index().on("dueDate", Sort.Direction.ASC).named("idx_charge_duedate")
            );
            // Compound index for overdue query optimization
            mongoTemplate.indexOps("charges").ensureIndex(
                new Index()
                    .on("organizationId", Sort.Direction.ASC)
                    .on("status", Sort.Direction.ASC)
                    .on("dueDate", Sort.Direction.ASC)
                    .named("idx_charge_overdue_query")
            );
            // Compound index for user charges
            mongoTemplate.indexOps("charges").ensureIndex(
                new Index()
                    .on("organizationId", Sort.Direction.ASC)
                    .on("userId", Sort.Direction.ASC)
                    .named("idx_charge_org_user")
            );

            // ═══════════════════════════════════════════════
            //              EXPENSE INDEXES
            // ═══════════════════════════════════════════════
            mongoTemplate.indexOps("expenses").ensureIndex(
                new Index().on("organizationId", Sort.Direction.ASC).named("idx_expense_organization")
            );
            mongoTemplate.indexOps("expenses").ensureIndex(
                new Index().on("buildingId", Sort.Direction.ASC).named("idx_expense_building")
            );
            mongoTemplate.indexOps("expenses").ensureIndex(
                new Index().on("category", Sort.Direction.ASC).named("idx_expense_category")
            );
            mongoTemplate.indexOps("expenses").ensureIndex(
                new Index().on("expenseDate", Sort.Direction.DESC).named("idx_expense_date")
            );
            // Compound index for building expenses
            mongoTemplate.indexOps("expenses").ensureIndex(
                new Index()
                    .on("organizationId", Sort.Direction.ASC)
                    .on("buildingId", Sort.Direction.ASC)
                    .named("idx_expense_org_building")
            );

            // ═══════════════════════════════════════════════
            //              PAYMENT INDEXES
            // ═══════════════════════════════════════════════
            mongoTemplate.indexOps("payments").ensureIndex(
                new Index().on("organizationId", Sort.Direction.ASC).named("idx_payment_organization")
            );
            mongoTemplate.indexOps("payments").ensureIndex(
                new Index().on("userId", Sort.Direction.ASC).named("idx_payment_user")
            );
            mongoTemplate.indexOps("payments").ensureIndex(
                new Index().on("chargeId", Sort.Direction.ASC).named("idx_payment_charge")
            );
            mongoTemplate.indexOps("payments").ensureIndex(
                new Index().on("paymentDate", Sort.Direction.DESC).named("idx_payment_date")
            );

            // ═══════════════════════════════════════════════
            //              WALLET INDEXES
            // ═══════════════════════════════════════════════
            mongoTemplate.indexOps("wallets").ensureIndex(
                new Index().on("organizationId", Sort.Direction.ASC).named("idx_wallet_organization")
            );
            mongoTemplate.indexOps("wallets").ensureIndex(
                new Index().on("userId", Sort.Direction.ASC).named("idx_wallet_user_unique")
            );

            // ═══════════════════════════════════════════════
            //              USER/ACCOUNT INDEXES
            // ═══════════════════════════════════════════════
            mongoTemplate.indexOps("accounts").ensureIndex(
                new Index().on("email", Sort.Direction.ASC).unique().named("idx_account_email_unique")
            );
            mongoTemplate.indexOps("accounts").ensureIndex(
                new Index().on("organizationId", Sort.Direction.ASC).named("idx_account_organization")
            );
            mongoTemplate.indexOps("accounts").ensureIndex(
                new Index().on("role", Sort.Direction.ASC).named("idx_account_role")
            );

            log.info("✓ MongoDB indexes created successfully");
        } catch (Exception e) {
            log.error("Failed to create MongoDB indexes: {}", e.getMessage(), e);
        }
    }
}
