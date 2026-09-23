package tn.esprit.pidev.services.solarenergy;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.solarenergy.AnomalyHistory;
import tn.esprit.pidev.repositories.solarenergy.AnomalyHistoryRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class AnomalyHistoryService {

    private final AnomalyHistoryRepository repository;

    public List<AnomalyHistory> getHistoryBySystem(String systemId) {
        return repository.findBySolarSystemIdOrderByTimestampDesc(systemId);
    }

    public AnomalyHistory create(AnomalyHistory history) {
        if (history.getTimestamp() == null) {
            history.setTimestamp(LocalDateTime.now());
        }
        return repository.save(history);
    }

    public AnomalyHistory resolve(String id, String type, String action, String notes) {
        AnomalyHistory history = repository.findById(id).orElseThrow(() ->
            new NoSuchElementException("Anomaly record not found")
        );
        
        history.setAnomalyType(type);
        history.setResolutionAction(action);
        history.setTechnicianNotes(notes);
        history.setStatus("RESOLVED");
        history.setResolvedAt(LocalDateTime.now());
        
        return repository.save(history);
    }
}
