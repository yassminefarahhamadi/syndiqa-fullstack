package tn.esprit.pidev.services.solarenergy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.solarenergy.EnergyReading;
import tn.esprit.pidev.entities.solarenergy.SolarSystem;
import tn.esprit.pidev.events.solarenergy.ReadingSavedEvent;
import tn.esprit.pidev.repositories.solarenergy.EnergyReadingRepository;
import tn.esprit.pidev.services.user.EmailService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnomalyDetectionService {

    private final EnergyReadingRepository readingRepo;
    private final tn.esprit.pidev.repositories.solarenergy.SolarSystemRepository solarSystemRepository;
    private final EmailService emailService;
    private final tn.esprit.pidev.services.notification.SmsService smsService;
    private final tn.esprit.pidev.services.solarenergy.AnomalyHistoryService anomalyHistoryService;

    // Throttle alerting to max 1 email per hour per system
    private final Map<String, LocalDateTime> lastAlertTime = new ConcurrentHashMap<>();

    @Async
    @EventListener
    public void onReadingSaved(ReadingSavedEvent event) {
        EnergyReading current = event.getReading();
        if (current == null || current.getPower() <= 0) return;

        // 1. Nighttime Safety Guard: Ignore readings between 20:00 and 06:00
        int hour = current.getTimestamp() != null ? current.getTimestamp().getHour() : LocalDateTime.now().getHour();
        if (hour >= 20 || hour < 6) {
            return;
        }

        String sysId = current.getSolarSystemId();

        // 2. Throttle guard (1 per hour max to prevent email spam)
        LocalDateTime lastAlert = lastAlertTime.get(sysId);
        if (lastAlert != null && lastAlert.isAfter(LocalDateTime.now().minusHours(1))) {
            return;
        }

        // 3. Compute baseline average over the last 7 days
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);
        List<EnergyReading> history = readingRepo.findBySolarSystemIdAndTimestampAfter(sysId, oneWeekAgo);

        if (history.isEmpty()) {
            return; // Not enough data for statistical baseline
        }

        double totalPower = 0;
        int count = 0;
        for (EnergyReading r : history) {
            // Only aggregate daytime readings for a fair baseline
            int h = (r.getTimestamp() != null) ? r.getTimestamp().getHour() : 12;
            if (h >= 6 && h < 20 && !Objects.equals(r.getId(), current.getId())) {
                totalPower += r.getPower();
                count++;
            }
        }

        if (count < 10) {
            return; // Need at least a few readings to form a stable trend
        }

        double moyenne = totalPower / count;

        // 4. Statistical Rule Detection: power < moyenne - 30%
        double threshold = moyenne * 0.70;

        SolarSystem sys = solarSystemRepository.findById(sysId).orElse(null);
        if (sys == null) return;

        if (current.getPower() < threshold) {
            log.warn("IA Anomalie: Power drop detected for system {}. Measured {} W vs Baseline Avg {} W",
                    sysId, current.getPower(), moyenne);

            if (!sys.isActiveAnomaly()) {
                sys.setActiveAnomaly(true);
                solarSystemRepository.save(sys);

                // Create history record
                anomalyHistoryService.create(tn.esprit.pidev.entities.solarenergy.AnomalyHistory.builder()
                        .solarSystemId(sysId)
                        .timestamp(LocalDateTime.now())
                        .powerAtTime(current.getPower())
                        .baselineAtTime(moyenne)
                        .status("PENDING")
                        .build());
                
                // Send email to yassminehamadi2@gmail.com
                emailService.sendAnomalyAlertEmail(sysId, current.getPower(), moyenne);
                
                // Send SMS to the user's phone number +21699875005
                smsService.sendAnomalyAlertSms("+21699875005", sysId, current.getPower(), moyenne);
                
                // Log alert time
                lastAlertTime.put(sysId, LocalDateTime.now());
            }
        } else {
            // Auto-resolve anomaly if power is back to normal
            if (sys.isActiveAnomaly()) {
                log.info("System {} is back to normal. Resolving anomaly.", sysId);
                sys.setActiveAnomaly(false);
                solarSystemRepository.save(sys);
            }
        }
    }
}
