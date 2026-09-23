package tn.esprit.pidev.controllers.IncidentAlert;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.dto.IncidentAlert.AlertRequest;
import tn.esprit.pidev.entities.IncidentAlert.Alert;
import tn.esprit.pidev.services.IncidentAlert.AlertService;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    // @Autowired
    private final tn.esprit.pidev.services.IncidentAlert.AlertService alertService;

    // ✅ Create alert
    @PostMapping
    public Alert create(@RequestBody AlertRequest request) {
        return alertService.create(request);
    }

    // ✅ Get all alerts
    @GetMapping
    public List<Alert> getAll() {
        return alertService.getAllByUserOrganization();
    }

    // ✅ Get alerts by incident
    @GetMapping("/incident/{incidentId}")
    public List<Alert> getByIncident(@PathVariable String incidentId) {
        return alertService.getByIncident(incidentId);
    }

    // ✅ Get alerts by target
    @GetMapping("/target/{target}")
    public List<Alert> getByTarget(@PathVariable String target) {
        return alertService.getByTarget(target);
    }

    // ✅ Delete alert
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        alertService.delete(id);
    }

    @PutMapping("/{id}/read")
    public Alert markAsRead(@PathVariable String id) {
        return alertService.markAsRead(id);
    }

    @GetMapping("/unread-count")
    public Long getUnreadCount() {
        return alertService.countUnread();
    }
}

