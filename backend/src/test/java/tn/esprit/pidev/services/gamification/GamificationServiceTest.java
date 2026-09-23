package tn.esprit.pidev.services.gamification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.pidev.dto.gamification.LeaderboardEntryDTO;
import tn.esprit.pidev.entities.gamification.EcoChallenge;
import tn.esprit.pidev.entities.gamification.ForestStats;
import tn.esprit.pidev.entities.solarenergy.EnergyReading;
import tn.esprit.pidev.entities.solarenergy.SolarSystem;
import tn.esprit.pidev.repositories.gamification.EcoChallengeRepository;
import tn.esprit.pidev.repositories.gamification.ForestStatsRepository;
import tn.esprit.pidev.repositories.solarenergy.SolarSystemRepository;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GamificationServiceTest {

    @Mock
    private EcoChallengeRepository challengeRepo;
    @Mock
    private ForestStatsRepository forestRepo;
    @Mock
    private SolarSystemRepository solarRepo;

    @InjectMocks
    private GamificationService gamificationService;

    private SolarSystem solarSystem;
    private EnergyReading reading;

    @BeforeEach
    void setUp() {
        solarSystem = SolarSystem.builder()
                .id("sys1")
                .buildingId("b1")
                .build();

        reading = EnergyReading.builder()
                .solarSystemId("sys1")
                .power(1000.0) // 1 kW -> 1 kWh (simplified for test)
                .build();
    }

    @Test
    void testUpdateGamificationProgress_UpdatesForestAndChallenges() {
        // Arrange
        when(solarRepo.findById("sys1")).thenReturn(Optional.of(solarSystem));
        when(forestRepo.findById("b1")).thenReturn(Optional.empty());
        
        EcoChallenge challenge = EcoChallenge.builder()
                .id("ch1")
                .buildingId("b1")
                .status(EcoChallenge.ChallengeStatus.ACTIVE)
                .currentKwh(0)
                .targetKwh(10)
                .build();
        when(challengeRepo.findByBuildingId("b1")).thenReturn(Collections.singletonList(challenge));

        // Act
        gamificationService.updateGamificationProgress(reading);

        // Assert
        verify(forestRepo, times(1)).save(any(ForestStats.class));
        verify(challengeRepo, times(1)).save(argThat(c -> c.getCurrentKwh() > 0));
    }
}
