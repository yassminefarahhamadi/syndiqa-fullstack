package tn.esprit.pidev.entities.user

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document(collection = "user_profiles")
data class Profile(

    @Id
    val id: String? = null,

    @Indexed(unique = true)
    val accountId: String = "",

    // =========================
    // DONNÉES FINANCIÈRES
    // =========================

    var salary: Double = 0.0,

    var monthlyExpenses: Double = 0.0,

    // =========================
    // STABILITÉ PROFESSIONNELLE
    // =========================

    var yearsEmployed: Int = 0,

    // =========================
    // HISTORIQUE FINANCIER
    // =========================

    var hasPaymentIncidents: Boolean = false,

    var creditHistoryLength: Int = 0,

    // =========================
    // FEATURES CALCULÉES (IA)
    // =========================

    var rentToIncomeRatio: Double? = null,

    var disposableIncome: Double? = null,

    // =========================
    // SCORE IA
    // =========================

    var riskScore: Double? = null,

    val createdAt: Instant = Instant.now(),

    var updatedAt: Instant = Instant.now()
)
