package tn.esprit.pidev.controllers.gamification;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.gamification.EcoChallenge;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.repositories.gamification.EcoChallengeRepository;
import tn.esprit.pidev.security.Roles;

import java.util.List;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class EcoChallengeController {

    private final EcoChallengeRepository challengeRepo;

    @GetMapping
    public ResponseEntity<List<EcoChallenge>> getChallenges(@RequestParam(required = false) String buildingId) {
        if (buildingId != null) {
            return ResponseEntity.ok(challengeRepo.findByBuildingId(buildingId));
        }
        return ResponseEntity.ok(challengeRepo.findAll());
    }

    @PostMapping
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<EcoChallenge> createChallenge(@RequestBody EcoChallenge challenge) {
        challenge.setStatus(EcoChallenge.ChallengeStatus.ACTIVE);
        return ResponseEntity.ok(challengeRepo.save(challenge));
    }

    @DeleteMapping("/{id}")
    @Roles({AccountRole.SYNDIC_ADMIN, AccountRole.PLATFORM_ADMIN})
    public ResponseEntity<Void> deleteChallenge(@PathVariable String id) {
        challengeRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
