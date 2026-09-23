package tn.esprit.pidev.entities.gamification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "eco_challenges")
public class EcoChallenge {
    @Id
    private String id;
    private String title;
    private String description;
    private double targetKwh;
    private double currentKwh;
    private LocalDate startDate;
    private LocalDate endDate;
    private ChallengeStatus status;
    private String buildingId;

    public enum ChallengeStatus {
        ACTIVE, COMPLETED, FAILED
    }
}
