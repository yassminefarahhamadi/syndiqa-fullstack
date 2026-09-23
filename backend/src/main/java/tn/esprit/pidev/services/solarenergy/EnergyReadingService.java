package tn.esprit.pidev.services.solarenergy;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.solarenergy.Esp32PotentiometerReading;
import tn.esprit.pidev.entities.solarenergy.EnergyReading;
import tn.esprit.pidev.events.solarenergy.ReadingSavedEvent;
import tn.esprit.pidev.repositories.solarenergy.EnergyReadingRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class EnergyReadingService {

    private final EnergyReadingRepository readingRepo;
    private final tn.esprit.pidev.services.gamification.GamificationService gamificationService;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Persists a new reading and triggers gamification sync.
     */
    public EnergyReading create(EnergyReading reading) {
        reading.setId(null);
        reading.setTimestamp(LocalDateTime.now());
        EnergyReading saved = readingRepo.save(reading);

        // Trigger gamification sync
        gamificationService.updateGamificationProgress(saved);

        // Publish event for anomaly detection
        eventPublisher.publishEvent(new ReadingSavedEvent(saved));

        return saved;
    }

    public EnergyReading createFromDevice(Esp32PotentiometerReading dto) {
        double intensity = Math.max(0, Math.min(1, dto.getAnalogValue() / 1023.0));
        double voltage = 20.0 * intensity;
        double current = 8.0 * intensity;
        double power = voltage * current;

        EnergyReading reading = EnergyReading.builder()
                .solarSystemId(dto.getSolarSystemId())
                .voltage(voltage)
                .current(current)
                .power(power)
                .build();

        return create(reading);
    }

    public List<EnergyReading> getBySolarSystem(String solarSystemId) {
        return readingRepo.findBySolarSystemId(solarSystemId);
    }

    public List<EnergyReading> getAll() {
        return readingRepo.findAll();
    }

    public EnergyReading getById(String id) {
        return readingRepo.findById(id).orElseThrow(() ->
            new NoSuchElementException("Reading with id=" + id + " not found")
        );
    }

    public EnergyReading update(String id, EnergyReading updated) {
        EnergyReading existing = getById(id);
        updated.setId(existing.getId());
        updated.setTimestamp(existing.getTimestamp());
        return readingRepo.save(updated);
    }

    public void delete(String id) {
        if (!readingRepo.existsById(id)) {
            throw new NoSuchElementException("Reading with id=" + id + " not found");
        }
        readingRepo.deleteById(id);
    }
}
