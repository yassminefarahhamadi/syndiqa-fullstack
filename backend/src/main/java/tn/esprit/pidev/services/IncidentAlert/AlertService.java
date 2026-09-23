package tn.esprit.pidev.services.IncidentAlert;


import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.IncidentAlert.AlertRequest;
import tn.esprit.pidev.entities.IncidentAlert.Alert;
import tn.esprit.pidev.entities.IncidentAlert.Incident;
import tn.esprit.pidev.entities.user.Account;
import tn.esprit.pidev.entities.user.Building;
import tn.esprit.pidev.repositories.IncidentAlert.AlertRepository;
import tn.esprit.pidev.repositories.IncidentAlert.IncidentRepository;
import tn.esprit.pidev.repositories.user.AccountRepository;
import tn.esprit.pidev.repositories.user.UserBuildingRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final AccountRepository accountRepository;
    private final UserBuildingRepository userBuildingRepository;
    private final IncidentRepository incidentRepository;

    // ✅ Create new alert
    public Alert create(AlertRequest request) {
        Alert alert = Alert.builder()
            .incidentId(request.getIncidentId())
            .message(request.getMessage())
            .targetRole("SYNDIC-Admin")
            .isRead(false)
            .createdAt(LocalDateTime.now())
            .build();

        return alertRepository.save(alert);
    }

    // ✅ Get all alerts
   /* public List<Alert> getAll() {
        return alertRepository.findAll();
    }*/
    public List<Alert> getAllByUserOrganization() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        String userId = auth.getName();

        Account account = accountRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Account not found"));

        String orgId = account.getOrganizationId();

        // 1. Get buildings of organization
        List<String> buildingIds = userBuildingRepository
            .findByOrganizationId(orgId)
            .stream()
            .map(Building::getId)
            .toList();

        // 2. Get incidents of those buildings
        List<String> incidentIds = incidentRepository
            .findByBuildingIdIn(buildingIds)
            .stream()
            .map(Incident::getId)
            .toList();

        // 3. Get alerts only for those incidents
        List<Alert> alerts = alertRepository
            .findByIncidentIdInOrderByCreatedAtDesc(incidentIds);

        return alerts;
    }

    // ✅ Get alerts by incident
    public List<Alert> getByIncident(String incidentId) {
        return alertRepository.findByIncidentId(incidentId);
    }

    // ✅ Get alerts by target
    public List<Alert> getByTarget(String target) {
        return alertRepository.findByTargetRole(target);
    }

    // ✅ Delete alert
    public void delete(String id) {
        alertRepository.deleteById(id);
    }

    public Alert markAsRead(String alertId) {
        Alert alert = alertRepository.findById(alertId)
            .orElseThrow(() -> new RuntimeException("Alert not found"));

        alert.setIsRead(true); // ✅ mark as read
        return alertRepository.save(alert);
    }


    public Long countUnread() {
        return alertRepository.countByIsReadFalse();
    }
}

