package tn.esprit.pidev.services.user

import org.springframework.stereotype.Service
import tn.esprit.pidev.entities.user.Profile
import tn.esprit.pidev.repositories.user.ProfileRepository
import java.time.Instant

@Service
class ProfileService(private val repo: ProfileRepository) {

    fun getAll(): List<Profile> = repo.findAll()

    fun getById(id: String): Profile =
        repo.findById(id).orElseThrow { NoSuchElementException("Profil introuvable: id=$id") }

    fun getByAccountId(accountId: String): Profile =
        repo.findByAccountId(accountId)
            ?: throw NoSuchElementException("Aucun profil pour accountId=$accountId")

    fun create(profile: Profile): Profile {
        if (repo.existsByAccountId(profile.accountId)) {
            throw IllegalStateException("Un profil existe déjà pour ce compte (accountId=${profile.accountId})")
        }
        return repo.save(withComputedFields(profile.copy(id = null, createdAt = Instant.now())))
    }

    fun update(id: String, updated: Profile): Profile {
        val existing = getById(id)
        // prevent changing accountId
        val toSave = updated.copy(
            id = existing.id,
            accountId = existing.accountId,
            createdAt = existing.createdAt,
            updatedAt = Instant.now()
        )
        return repo.save(withComputedFields(toSave))
    }

    fun updateRiskScore(id: String, score: Double): Profile {
        val existing = getById(id)
        return repo.save(existing.copy(riskScore = score, updatedAt = Instant.now()))
    }

    fun delete(id: String) {
        if (!repo.existsById(id)) throw NoSuchElementException("Profil introuvable: id=$id")
        repo.deleteById(id)
    }

    // Auto-calcule disposableIncome à chaque sauvegarde
    private fun withComputedFields(p: Profile): Profile =
        p.copy(disposableIncome = p.salary - p.monthlyExpenses)
}
