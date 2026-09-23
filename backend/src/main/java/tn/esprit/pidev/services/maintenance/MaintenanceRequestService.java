package tn.esprit.pidev.services.maintenance;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.maintenance.MaintenanceCategory;
import tn.esprit.pidev.entities.maintenance.MaintenanceRequest;
import tn.esprit.pidev.entities.maintenance.MaintenanceSeverity;
import tn.esprit.pidev.entities.maintenance.MaintenanceSource;
import tn.esprit.pidev.entities.maintenance.Priority;
import tn.esprit.pidev.entities.maintenance.Status;
import tn.esprit.pidev.repositories.maintenance.MaintenanceRequestRepository;
import tn.esprit.pidev.repositories.maintenance.MaintenanceTaskRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MaintenanceRequestService {

    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final MaintenanceTaskRepository maintenanceTaskRepository;
    private static final DateTimeFormatter CODE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    public MaintenanceRequest create(MaintenanceRequest maintenanceRequest) {
        return create(maintenanceRequest, null, null, null);
    }

    public MaintenanceRequest create(MaintenanceRequest maintenanceRequest, String organizationId, String accountId) {
        return create(maintenanceRequest, organizationId, accountId, null);
    }

    public MaintenanceRequest create(MaintenanceRequest maintenanceRequest, String organizationId, String accountId, String role) {
        LocalDateTime now = LocalDateTime.now();

        if (organizationId != null && !organizationId.isBlank()) {
            maintenanceRequest.setOrganizationId(organizationId);
        }
        if (accountId != null && !accountId.isBlank()) {
            maintenanceRequest.setReporterAccountId(accountId);
            maintenanceRequest.setCreatedByAccountId(accountId);
            maintenanceRequest.setLastUpdatedByAccountId(accountId);
        }

        if (maintenanceRequest.getMaintenanceCode() == null || maintenanceRequest.getMaintenanceCode().isBlank()) {
            maintenanceRequest.setMaintenanceCode(generateMaintenanceCode(now));
        }
        if (maintenanceRequest.getCreatedAt() == null) {
            maintenanceRequest.setCreatedAt(now);
        }
        maintenanceRequest.setUpdatedAt(now);

        if (maintenanceRequest.getStatus() == null) {
            maintenanceRequest.setStatus(Status.OPEN);
        }
        if (maintenanceRequest.getPriority() == null) {
            maintenanceRequest.setPriority(Priority.MEDIUM);
        }
        if (maintenanceRequest.getCategory() == null) {
            maintenanceRequest.setCategory(MaintenanceCategory.OTHER);
        }
        if (maintenanceRequest.getSeverity() == null) {
            maintenanceRequest.setSeverity(MaintenanceSeverity.MEDIUM);
        }
        if (maintenanceRequest.getSource() == null) {
            maintenanceRequest.setSource(resolveSource(role));
        }

        initializeProgress(maintenanceRequest);
        applyLifecycleDates(maintenanceRequest, null, now, accountId);

        return maintenanceRequestRepository.save(maintenanceRequest);
    }

    public List<MaintenanceRequest> getAll() {
        return maintenanceRequestRepository.findAll();
    }

    public List<MaintenanceRequest> getAll(String organizationId, String role, String accountId) {
        if ("PLATFORM_ADMIN".equals(role) || "PLATFORM_OWNER_ADMIN".equals(role)) {
            return getAll();
        }

        if ("RESIDENT".equals(role)) {
            if (accountId == null || accountId.isBlank()) {
                return List.of();
            }
            return maintenanceRequestRepository.findByReporterAccountId(accountId);
        }

        if (organizationId == null || organizationId.isBlank()) {
            return List.of();
        }

        return maintenanceRequestRepository.findByOrganizationId(organizationId);
    }

    public Optional<MaintenanceRequest> getById(String id) {
        return maintenanceRequestRepository.findById(id);
    }

    public Optional<MaintenanceRequest> update(String id, MaintenanceRequest maintenanceRequest) {
        return update(id, maintenanceRequest, null);
    }

    public Optional<MaintenanceRequest> update(String id, MaintenanceRequest maintenanceRequest, String accountId) {
        return maintenanceRequestRepository.findById(id)
                .map(existing -> {
                    maintenanceRequest.setId(existing.getId());
                    Status previousStatus = existing.getStatus();

                    if (maintenanceRequest.getCreatedAt() == null) {
                        maintenanceRequest.setCreatedAt(existing.getCreatedAt());
                    }
                    maintenanceRequest.setUpdatedAt(LocalDateTime.now());

                    if (maintenanceRequest.getMaintenanceCode() == null || maintenanceRequest.getMaintenanceCode().isBlank()) {
                        maintenanceRequest.setMaintenanceCode(existing.getMaintenanceCode());
                    }

                    if (maintenanceRequest.getOrganizationId() == null || maintenanceRequest.getOrganizationId().isBlank()) {
                        maintenanceRequest.setOrganizationId(existing.getOrganizationId());
                    }
                    if (maintenanceRequest.getReporterAccountId() == null || maintenanceRequest.getReporterAccountId().isBlank()) {
                        maintenanceRequest.setReporterAccountId(existing.getReporterAccountId());
                    }
                    if (maintenanceRequest.getReportedBy() == null || maintenanceRequest.getReportedBy().isBlank()) {
                        maintenanceRequest.setReportedBy(existing.getReportedBy());
                    }

                    if (maintenanceRequest.getBuildingId() == null || maintenanceRequest.getBuildingId().isBlank()) {
                        maintenanceRequest.setBuildingId(existing.getBuildingId());
                    }
                    if (maintenanceRequest.getResidenceId() == null || maintenanceRequest.getResidenceId().isBlank()) {
                        maintenanceRequest.setResidenceId(existing.getResidenceId());
                    }
                    if (maintenanceRequest.getLocationDetails() == null || maintenanceRequest.getLocationDetails().isBlank()) {
                        maintenanceRequest.setLocationDetails(existing.getLocationDetails());
                    }

                    if (maintenanceRequest.getCreatedByAccountId() == null || maintenanceRequest.getCreatedByAccountId().isBlank()) {
                        maintenanceRequest.setCreatedByAccountId(existing.getCreatedByAccountId());
                    }
                    if (accountId != null && !accountId.isBlank()) {
                        maintenanceRequest.setLastUpdatedByAccountId(accountId);
                    } else if (maintenanceRequest.getLastUpdatedByAccountId() == null || maintenanceRequest.getLastUpdatedByAccountId().isBlank()) {
                        maintenanceRequest.setLastUpdatedByAccountId(existing.getLastUpdatedByAccountId());
                    }
                    if (maintenanceRequest.getClosedByAccountId() == null || maintenanceRequest.getClosedByAccountId().isBlank()) {
                        maintenanceRequest.setClosedByAccountId(existing.getClosedByAccountId());
                    }

                    if (maintenanceRequest.getStatus() == null) {
                        maintenanceRequest.setStatus(existing.getStatus());
                    }
                    if (maintenanceRequest.getPriority() == null) {
                        maintenanceRequest.setPriority(existing.getPriority());
                    }
                    if (maintenanceRequest.getCategory() == null) {
                        maintenanceRequest.setCategory(existing.getCategory() != null ? existing.getCategory() : MaintenanceCategory.OTHER);
                    }
                    if (maintenanceRequest.getSeverity() == null) {
                        maintenanceRequest.setSeverity(existing.getSeverity() != null ? existing.getSeverity() : MaintenanceSeverity.MEDIUM);
                    }
                    if (maintenanceRequest.getSource() == null) {
                        maintenanceRequest.setSource(existing.getSource());
                    }

                    if (maintenanceRequest.getDueAt() == null) {
                        maintenanceRequest.setDueAt(existing.getDueAt());
                    }
                    if (maintenanceRequest.getAcknowledgedAt() == null) {
                        maintenanceRequest.setAcknowledgedAt(existing.getAcknowledgedAt());
                    }
                    if (maintenanceRequest.getStartedAt() == null) {
                        maintenanceRequest.setStartedAt(existing.getStartedAt());
                    }
                    if (maintenanceRequest.getResolvedAt() == null) {
                        maintenanceRequest.setResolvedAt(existing.getResolvedAt());
                    }
                    if (maintenanceRequest.getVerifiedAt() == null) {
                        maintenanceRequest.setVerifiedAt(existing.getVerifiedAt());
                    }

                    if (maintenanceRequest.getSubTaskCount() == null) {
                        maintenanceRequest.setSubTaskCount(existing.getSubTaskCount());
                    }
                    if (maintenanceRequest.getCompletedSubTaskCount() == null) {
                        maintenanceRequest.setCompletedSubTaskCount(existing.getCompletedSubTaskCount());
                    }
                    if (maintenanceRequest.getProgressPercent() == null) {
                        maintenanceRequest.setProgressPercent(existing.getProgressPercent());
                    }

                    initializeProgress(maintenanceRequest);
                    applyLifecycleDates(maintenanceRequest, previousStatus, LocalDateTime.now(), accountId);

                    return maintenanceRequestRepository.save(maintenanceRequest);
                });
    }

    public boolean delete(String id) {
        if (!maintenanceRequestRepository.existsById(id)) {
            return false;
        }

        // Cascade delete: remove all tasks linked to this maintenance request first.
        maintenanceTaskRepository.deleteByMaintenanceRequestId(id);
        maintenanceRequestRepository.deleteById(id);
        return true;
    }

    private void initializeProgress(MaintenanceRequest maintenanceRequest) {
        int total = maintenanceRequest.getSubTaskCount() != null ? Math.max(0, maintenanceRequest.getSubTaskCount()) : 0;
        int done = maintenanceRequest.getCompletedSubTaskCount() != null
                ? Math.max(0, Math.min(maintenanceRequest.getCompletedSubTaskCount(), total))
                : 0;

        maintenanceRequest.setSubTaskCount(total);
        maintenanceRequest.setCompletedSubTaskCount(done);

        if (total == 0) {
            maintenanceRequest.setProgressPercent(0d);
            return;
        }

        if (maintenanceRequest.getProgressPercent() == null) {
            maintenanceRequest.setProgressPercent((done * 100d) / total);
        }
    }

    private void applyLifecycleDates(MaintenanceRequest maintenanceRequest, Status previousStatus, LocalDateTime now, String accountId) {
        Status status = maintenanceRequest.getStatus();
        if (status == null) {
            return;
        }

        if ((status == Status.IN_PROGRESS || status == Status.COMPLETED || status == Status.VERIFIED)
                && maintenanceRequest.getAcknowledgedAt() == null) {
            maintenanceRequest.setAcknowledgedAt(now);
        }

        if ((status == Status.IN_PROGRESS || status == Status.COMPLETED || status == Status.VERIFIED)
                && maintenanceRequest.getStartedAt() == null) {
            maintenanceRequest.setStartedAt(now);
        }

        if ((status == Status.COMPLETED || status == Status.VERIFIED) && maintenanceRequest.getResolvedAt() == null) {
            maintenanceRequest.setResolvedAt(now);
        }

        if (status == Status.VERIFIED && maintenanceRequest.getVerifiedAt() == null) {
            maintenanceRequest.setVerifiedAt(now);
        }

        if ((status == Status.COMPLETED || status == Status.VERIFIED)
                && previousStatus != status
                && accountId != null
                && !accountId.isBlank()) {
            maintenanceRequest.setClosedByAccountId(accountId);
        }
    }

    private String generateMaintenanceCode(LocalDateTime now) {
        return "MNT-" + CODE_FORMAT.format(now);
    }

    private MaintenanceSource resolveSource(String role) {
        if (role == null || role.isBlank()) {
            return MaintenanceSource.RESIDENT;
        }

        return switch (role) {
            case "PLATFORM_ADMIN", "PLATFORM_OWNER_ADMIN" -> MaintenanceSource.PLATFORM_ADMIN;
            case "SYNDIC_ADMIN" -> MaintenanceSource.SYNDIC_ADMIN;
            case "TECHNICAL_STAFF" -> MaintenanceSource.TECHNICAL_STAFF;
            case "SYSTEM" -> MaintenanceSource.SYSTEM;
            default -> MaintenanceSource.RESIDENT;
        };
    }
}

