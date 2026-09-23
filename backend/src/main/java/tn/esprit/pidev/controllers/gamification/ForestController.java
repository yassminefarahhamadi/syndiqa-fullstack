package tn.esprit.pidev.controllers.gamification;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.pidev.entities.gamification.ForestStats;
import tn.esprit.pidev.repositories.gamification.ForestStatsRepository;

@RestController
@RequestMapping("/api/forest")
@RequiredArgsConstructor
public class ForestController {

    private final ForestStatsRepository forestRepo;

    @GetMapping
    public ResponseEntity<ForestStats> getForestStats(@RequestParam String buildingId) {
        return forestRepo.findById(buildingId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
