package tn.esprit.pidev.controllers.gamification;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.pidev.dto.gamification.LeaderboardEntryDTO;
import tn.esprit.pidev.services.gamification.GamificationService;

import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final GamificationService gamificationService;

    @GetMapping
    public ResponseEntity<List<LeaderboardEntryDTO>> getLeaderboard(
            @RequestParam(required = false) String date) {
        
        return ResponseEntity.ok(gamificationService.getLeaderboard(date));
    }
}
