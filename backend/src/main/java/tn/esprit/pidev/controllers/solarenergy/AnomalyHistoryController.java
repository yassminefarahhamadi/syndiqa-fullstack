package tn.esprit.pidev.controllers.solarenergy;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.solarenergy.AnomalyHistory;
import tn.esprit.pidev.services.solarenergy.AnomalyHistoryService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/anomalies")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AnomalyHistoryController {

    private final AnomalyHistoryService service;

    @GetMapping("/system/{systemId}")
    public List<AnomalyHistory> getHistory(@PathVariable String systemId) {
        return service.getHistoryBySystem(systemId);
    }

    @PutMapping("/{id}/resolve")
    public AnomalyHistory resolve(
            @PathVariable String id,
            @RequestBody Map<String, String> resolutionData) {
        
        return service.resolve(
                id,
                resolutionData.get("type"),
                resolutionData.get("action"),
                resolutionData.get("notes")
        );
    }
}
