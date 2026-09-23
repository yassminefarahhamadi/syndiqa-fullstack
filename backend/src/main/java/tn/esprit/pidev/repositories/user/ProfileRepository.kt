package tn.esprit.pidev.repositories.user

import org.springframework.data.mongodb.repository.MongoRepository
import tn.esprit.pidev.entities.user.Profile

interface ProfileRepository : MongoRepository<Profile, String> {
    fun findByAccountId(accountId: String): Profile?
    fun existsByAccountId(accountId: String): Boolean
}
