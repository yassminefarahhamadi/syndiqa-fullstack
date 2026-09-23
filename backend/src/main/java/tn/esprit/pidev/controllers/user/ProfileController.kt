package tn.esprit.pidev.controllers.user

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import tn.esprit.pidev.entities.user.Profile
import tn.esprit.pidev.services.user.ProfileService

@RestController
@RequestMapping("/profile")
@CrossOrigin(origins = ["http://localhost:4200"])
class ProfileController(private val service: ProfileService) {

    @GetMapping
    fun getAll(): List<Profile> = service.getAll()

    @GetMapping("/{id}")
    fun getById(@PathVariable id: String): Profile = service.getById(id)

    @GetMapping("/account/{accountId}")
    fun getByAccount(@PathVariable accountId: String): Profile = service.getByAccountId(accountId)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody profile: Profile): Profile = service.create(profile)

    @PutMapping("/{id}")
    fun update(@PathVariable id: String, @RequestBody profile: Profile): Profile =
        service.update(id, profile)

    @PatchMapping("/{id}/risk-score")
    fun updateRiskScore(
        @PathVariable id: String,
        @RequestParam score: Double
    ): Profile = service.updateRiskScore(id, score)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: String) = service.delete(id)
}
