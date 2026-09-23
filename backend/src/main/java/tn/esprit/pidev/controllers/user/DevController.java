package tn.esprit.pidev.controllers.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.pidev.entities.property.Building;
import tn.esprit.pidev.entities.solarenergy.EnergyReading;
import tn.esprit.pidev.entities.solarenergy.SolarSystem;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.entities.communityevents.AccountStatus;
import tn.esprit.pidev.repositories.property.PropertyBuildingRepository;
import tn.esprit.pidev.repositories.solarenergy.EnergyReadingRepository;
import tn.esprit.pidev.repositories.solarenergy.SolarSystemRepository;
import tn.esprit.pidev.entities.gamification.EcoChallenge;
import tn.esprit.pidev.entities.gamification.ForestStats;
import tn.esprit.pidev.repositories.gamification.EcoChallengeRepository;
import tn.esprit.pidev.repositories.gamification.ForestStatsRepository;
import tn.esprit.pidev.repositories.user.AccountRepository;
import tn.esprit.pidev.services.solarenergy.EnergyReadingService;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/dev")
@RequiredArgsConstructor
public class DevController {

    private final PropertyBuildingRepository buildingRepo;
    private final SolarSystemRepository solarRepo;
    private final EnergyReadingRepository readingRepo;
    private final EcoChallengeRepository challengeRepo;
    private final ForestStatsRepository forestRepo;
    private final AccountRepository accountRepo;
    private final PasswordEncoder passwordEncoder;
    private final EnergyReadingService energyReadingService;
    private final ApplicationEventPublisher eventPublisher;

    @PostMapping("/seed-engagement-demo")
    public ResponseEntity<Map<String, String>> seedEngagementDemo() {
        // 1. Create Buildings
        String resId = "RES-DEMO-01";
        List<Building> savedBuildings = new ArrayList<>();
        
        String[] bNames = {"Palais de Carthage", "Residence El Hana", "Tour Bleue"};
        for (String name : bNames) {
            Building b = new Building();
            b.setResidenceId(resId);
            b.setName(name);
            b.setFloorsCount(5);
            b.setParkingSpotsCount(10);
            savedBuildings.add(buildingRepo.save(b));
        }

        // 2. Create Solar Systems for each building
        List<SolarSystem> savedSystems = new ArrayList<>();
        for (Building b : savedBuildings) {
            SolarSystem sys = SolarSystem.builder()
                    .buildingId(b.getId())
                    .capacityKw(10.0 + new Random().nextDouble() * 5)
                    .installationDate(java.time.LocalDate.now().minusMonths(6))
                    .build();
            savedSystems.add(solarRepo.save(sys));
        }

        // 3. Create Energy Readings for April 2026
        LocalDateTime now = LocalDateTime.now();
        List<EnergyReading> readings = new ArrayList<>();
        Random rand = new Random();

        for (SolarSystem sys : savedSystems) {
            // Let's create readings for the last 15 days of April
            for (int day = 1; day <= 15; day++) {
                LocalDateTime dayTime = LocalDateTime.of(2026, 4, day, 12, 0);
                double dailyProd = 20.0 + rand.nextDouble() * 30.0; // 20-50 kWh per day
                
                EnergyReading rd = EnergyReading.builder()
                        .solarSystemId(sys.getId())
                        .power(dailyProd * 1000) // stored in Watts
                        .timestamp(dayTime)
                        .voltage(230.0)
                        .current(dailyProd / 0.230)
                        .build();
                readings.add(rd);
            }
        }
        readingRepo.saveAll(readings);

        // 4. Create Forest Stats and Challenges for each building
        for (Building b : savedBuildings) {
            // Calculate total energy for this building from the seeded readings
            double buildingKwh = readings.stream()
                .filter(r -> {
                    SolarSystem s = savedSystems.stream().filter(ss -> ss.getId().equals(r.getSolarSystemId())).findFirst().orElse(null);
                    return s != null && s.getBuildingId().equals(b.getId());
                })
                .mapToDouble(r -> r.getPower() / 1000.0)
                .sum();

            // Seed Forest Stats
            ForestStats forest = ForestStats.builder()
                    .buildingId(b.getId())
                    .totalKwh(buildingKwh)
                    .build();
            forestRepo.save(forest);

            // Seed an Active Challenge
            EcoChallenge challenge = EcoChallenge.builder()
                    .title("Avril Vert : Objectif " + b.getName())
                    .description("Atteignons ensemble 500 kWh de production solaire ce mois-ci !")
                    .targetKwh(500.0)
                    .currentKwh(buildingKwh)
                    .startDate(java.time.LocalDate.of(2026, 4, 1))
                    .endDate(java.time.LocalDate.of(2026, 4, 30))
                    .status(EcoChallenge.ChallengeStatus.ACTIVE)
                    .buildingId(b.getId())
                    .build();
            challengeRepo.save(challenge);
        }

        return ResponseEntity.ok(Map.of(
            "message", "Engagement Demo Data seeded successfully!",
            "buildingsCreated", String.valueOf(savedBuildings.size()),
            "readingsCreated", String.valueOf(readings.size())
        ));
    }

    @PostMapping("/trigger-anomaly")
    public ResponseEntity<Map<String, String>> triggerAnomalyDemo() {
        String sysId = "SYS-ANOMALY-" + new Random().nextInt(1000);
        
        // Ensure solar sys exists
        SolarSystem sys = SolarSystem.builder()
                .id(sysId)
                .buildingId("TEST-BLD")
                .capacityKw(5.0)
                .installationDate(java.time.LocalDate.now())
                .build();
        solarRepo.save(sys);

        // Seed 7 days of history during daytime (10:00 to 14:00)
        LocalDateTime now = LocalDateTime.now();
        List<EnergyReading> history = new ArrayList<>();
        for (int i = 7; i >= 1; i--) {
            for (int h = 10; h <= 14; h++) {
                EnergyReading rd = EnergyReading.builder()
                        .solarSystemId(sysId)
                        .power(1000.0) // 1000W baseline
                        .timestamp(now.minusDays(i).withHour(h).withMinute(0))
                        .voltage(230.0)
                        .current(4.34)
                        .build();
                history.add(rd);
            }
        }
        readingRepo.saveAll(history); // Bypass event for history

        // Now trigger an anomaly (Power drop to 200W, which is < 700W threshold)
        // Ensure its daytime to bypass night-guard (since the user is testing at night!)
        EnergyReading anomaly = EnergyReading.builder()
                .solarSystemId(sysId)
                .power(200.0)
                .voltage(230.0)
                .current(0.86)
                .timestamp(now.withHour(14).withMinute(0)) // Force 14:00 (2 PM)
                .build();
                
        // Bypass the EnergyReadingService.create() because it overrides timestamp to now()
        EnergyReading savedAnomaly = readingRepo.save(anomaly);
        
        // Push the event manually down the pipeline
        eventPublisher.publishEvent(new tn.esprit.pidev.events.solarenergy.ReadingSavedEvent(savedAnomaly));

        return ResponseEntity.ok(Map.of(
            "message", "Anomaly triggered!",
            "details", "Seeded 35 historical readings at 1000W. Pushed current reading at 200W.",
            "solarSystemId", sysId
        ));
    }
}
