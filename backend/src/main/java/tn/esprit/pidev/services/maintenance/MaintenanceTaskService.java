package tn.esprit.pidev.services.maintenance;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.maintenance.AssignableStaffOption;
import tn.esprit.pidev.entities.maintenance.MaintenanceRequest;
import tn.esprit.pidev.entities.maintenance.MaintenanceTask;
import tn.esprit.pidev.entities.maintenance.Status;
import tn.esprit.pidev.entities.maintenance.TaskStatus;
import tn.esprit.pidev.repositories.maintenance.MaintenanceRequestRepository;
import tn.esprit.pidev.repositories.maintenance.MaintenanceTaskRepository;
import tn.esprit.pidev.repositories.user.AccountRepository;
import tn.esprit.pidev.repositories.user.StaffProfileRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenanceTaskService {

    private final MaintenanceTaskRepository maintenanceTaskRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final AccountRepository accountRepository;

    private static final Set<String> ALLOWED_JOB_TITLES = Set.of(
        "plumber",
        "plombier",
        "electricienne",
        "gardien",
        "femme de menage",
        "technicien ascenseur",
        "jardinier",
        "concierge",
        "comptable"
    );

    public MaintenanceTask create(MaintenanceTask maintenanceTask) {
        return createForRequest(maintenanceTask.getMaintenanceRequestId(), maintenanceTask, null, null, null);
    }

    public MaintenanceTask createForRequest(String requestId, MaintenanceTask maintenanceTask, String organizationId, String role, String accountId) {
        if (requestId == null || requestId.isBlank()) {
            throw new IllegalArgumentException("maintenanceRequestId is required");
        }

        MaintenanceRequest request = findAuthorizedRequest(requestId, organizationId, role, accountId)
            .orElseThrow(() -> new IllegalArgumentException("Maintenance request not found or forbidden"));

        LocalDateTime now = LocalDateTime.now();
        maintenanceTask.setMaintenanceRequestId(requestId);

        if (maintenanceTask.getTitle() == null || maintenanceTask.getTitle().isBlank()) {
            maintenanceTask.setTitle("Sub-task");
        }
        if (maintenanceTask.getStatus() == null) {
            maintenanceTask.setStatus(TaskStatus.PENDING);
        }
        if (maintenanceTask.getOrderIndex() == null || maintenanceTask.getOrderIndex() < 0) {
            maintenanceTask.setOrderIndex(maintenanceTaskRepository.findByMaintenanceRequestIdOrderByOrderIndexAsc(requestId).size() + 1);
        }
        if (maintenanceTask.getCreatedAt() == null) {
            maintenanceTask.setCreatedAt(now);
        }
        maintenanceTask.setUpdatedAt(now);

        applyTaskDates(maintenanceTask, null);

        MaintenanceTask saved = maintenanceTaskRepository.save(maintenanceTask);
        refreshRequestProgressAndStatus(request);
        return saved;
    }

    public List<MaintenanceTask> getAll() {
        return maintenanceTaskRepository.findAll();
    }

    public List<MaintenanceTask> getAll(String organizationId, String role, String accountId) {
        if ("PLATFORM_ADMIN".equals(role) || "PLATFORM_OWNER_ADMIN".equals(role)) {
            return maintenanceTaskRepository.findAll();
        }

        if ("TECHNICAL_STAFF".equals(role)) {
            if (accountId == null || accountId.isBlank()) {
                return List.of();
            }
            return maintenanceTaskRepository.findByAssignedTo(accountId);
        }

        if ("RESIDENT".equals(role)) {
            if (accountId == null || accountId.isBlank()) {
                return List.of();
            }

            List<String> residentRequestIds = maintenanceRequestRepository.findByReporterAccountId(accountId).stream()
                .map(MaintenanceRequest::getId)
                .filter(id -> id != null && !id.isBlank())
                .toList();

            if (residentRequestIds.isEmpty()) {
                return List.of();
            }

            return maintenanceTaskRepository.findByMaintenanceRequestIdIn(residentRequestIds);
        }

        if (organizationId == null || organizationId.isBlank()) {
            return List.of();
        }

        List<String> organizationRequestIds = maintenanceRequestRepository.findByOrganizationId(organizationId).stream()
            .map(MaintenanceRequest::getId)
            .filter(id -> id != null && !id.isBlank())
            .toList();

        if (organizationRequestIds.isEmpty()) {
            return List.of();
        }

        return maintenanceTaskRepository.findByMaintenanceRequestIdIn(organizationRequestIds);
    }

    public List<MaintenanceTask> getByRequestId(String requestId, String organizationId, String role, String accountId) {
        return findAuthorizedRequest(requestId, organizationId, role, accountId)
            .map(req -> maintenanceTaskRepository.findByMaintenanceRequestIdOrderByOrderIndexAsc(req.getId()))
            .orElse(List.of());
    }

    public Optional<MaintenanceTask> getById(String id) {
        return maintenanceTaskRepository.findById(id);
    }

    public Optional<MaintenanceTask> getById(String id, String organizationId, String role, String accountId) {
        return maintenanceTaskRepository.findById(id)
            .flatMap(task -> findAuthorizedRequest(task.getMaintenanceRequestId(), organizationId, role, accountId)
                .map(req -> task));
    }

    public Optional<MaintenanceTask> update(String id, MaintenanceTask maintenanceTask) {
        return update(id, maintenanceTask, null, null, null);
    }

    public Optional<MaintenanceTask> update(String id, MaintenanceTask maintenanceTask, String organizationId, String role, String accountId) {
        return maintenanceTaskRepository.findById(id)
            .flatMap(existing -> findAuthorizedRequest(existing.getMaintenanceRequestId(), organizationId, role, accountId)
                .map(request -> {
                    TaskStatus previousStatus = existing.getStatus();

                    maintenanceTask.setId(existing.getId());
                    maintenanceTask.setMaintenanceRequestId(existing.getMaintenanceRequestId());

                    if (maintenanceTask.getTitle() == null || maintenanceTask.getTitle().isBlank()) {
                        maintenanceTask.setTitle(existing.getTitle());
                    }
                    if (maintenanceTask.getDescription() == null) {
                        maintenanceTask.setDescription(existing.getDescription());
                    }
                    if (maintenanceTask.getAssignedTo() == null || maintenanceTask.getAssignedTo().isBlank()) {
                        maintenanceTask.setAssignedTo(existing.getAssignedTo());
                    }
                    if (maintenanceTask.getOrderIndex() == null || maintenanceTask.getOrderIndex() < 0) {
                        maintenanceTask.setOrderIndex(existing.getOrderIndex());
                    }
                    if (maintenanceTask.getEstimatedMinutes() == null) {
                        maintenanceTask.setEstimatedMinutes(existing.getEstimatedMinutes());
                    }
                    if (maintenanceTask.getBlockedReason() == null) {
                        maintenanceTask.setBlockedReason(existing.getBlockedReason());
                    }
                    if (maintenanceTask.getScheduledDate() == null) {
                        maintenanceTask.setScheduledDate(existing.getScheduledDate());
                    }
                    if (maintenanceTask.getStartedDate() == null) {
                        maintenanceTask.setStartedDate(existing.getStartedDate());
                    }
                    if (maintenanceTask.getCompletedDate() == null) {
                        maintenanceTask.setCompletedDate(existing.getCompletedDate());
                    }
                    if (maintenanceTask.getStatus() == null) {
                        maintenanceTask.setStatus(existing.getStatus());
                    }
                    if (maintenanceTask.getCreatedAt() == null) {
                        maintenanceTask.setCreatedAt(existing.getCreatedAt());
                    }
                    maintenanceTask.setUpdatedAt(LocalDateTime.now());

                    applyTaskDates(maintenanceTask, previousStatus);

                    MaintenanceTask saved = maintenanceTaskRepository.save(maintenanceTask);
                    refreshRequestProgressAndStatus(request);
                    return saved;
                })
            );
    }

    public boolean delete(String id) {
        return delete(id, null, null, null);
    }

    public boolean delete(String id, String organizationId, String role, String accountId) {
        Optional<MaintenanceTask> existingOpt = maintenanceTaskRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return false;
        }

        MaintenanceTask existing = existingOpt.get();
        Optional<MaintenanceRequest> requestOpt = findAuthorizedRequest(existing.getMaintenanceRequestId(), organizationId, role, accountId);
        if (requestOpt.isEmpty()) {
            return false;
        }

        maintenanceTaskRepository.deleteById(id);
        refreshRequestProgressAndStatus(requestOpt.get());
        return true;
    }

    public List<AssignableStaffOption> getAssignableStaffOptions(String organizationId) {
        if (organizationId == null || organizationId.isBlank()) {
            return List.of();
        }

        Set<String> seen = new HashSet<>();

        return staffProfileRepository.findByOrganizationId(organizationId).stream()
            .filter(profile -> profile.getJobTitle() != null)
            .filter(profile -> ALLOWED_JOB_TITLES.contains(profile.getJobTitle().trim().toLowerCase()))
            .map(profile -> accountRepository.findById(profile.getAccountId())
                .map(account -> new AssignableStaffOption(
                    account.getId(),
                    (account.getFirstName() + " " + account.getLastName()).trim(),
                    profile.getJobTitle()
                ))
                .orElse(null)
            )
            .filter(option -> option != null && !option.getFullName().isBlank())
            .filter(option -> seen.add(option.getAccountId()))
            .collect(Collectors.toList());
    }

    private Optional<MaintenanceRequest> findAuthorizedRequest(String requestId, String organizationId, String role, String accountId) {
        if (requestId == null || requestId.isBlank()) {
            return Optional.empty();
        }

        Optional<MaintenanceRequest> requestOpt = maintenanceRequestRepository.findById(requestId);
        if (requestOpt.isEmpty()) {
            return Optional.empty();
        }

        MaintenanceRequest request = requestOpt.get();

        if ("PLATFORM_ADMIN".equals(role) || "PLATFORM_OWNER_ADMIN".equals(role)) {
            return requestOpt;
        }

        if ("RESIDENT".equals(role)) {
            if (accountId != null && accountId.equals(request.getReporterAccountId())) {
                return requestOpt;
            }
            return Optional.empty();
        }

        if ("TECHNICAL_STAFF".equals(role)) {
            return requestOpt;
        }

        if (organizationId != null && organizationId.equals(request.getOrganizationId())) {
            return requestOpt;
        }

        return Optional.empty();
    }

    private void applyTaskDates(MaintenanceTask task, TaskStatus previousStatus) {
        if (task.getStatus() == TaskStatus.IN_PROGRESS && task.getStartedDate() == null) {
            task.setStartedDate(LocalDate.now());
        }

        if (task.getStatus() == TaskStatus.COMPLETED && task.getCompletedDate() == null) {
            task.setCompletedDate(LocalDate.now());
        }

        if (task.getStatus() != TaskStatus.BLOCKED) {
            task.setBlockedReason(null);
        }

        if (previousStatus == TaskStatus.COMPLETED && task.getStatus() != TaskStatus.COMPLETED) {
            task.setCompletedDate(null);
        }
    }

    private void refreshRequestProgressAndStatus(MaintenanceRequest request) {
        List<MaintenanceTask> tasks = maintenanceTaskRepository.findByMaintenanceRequestIdOrderByOrderIndexAsc(request.getId());
        int total = tasks.size();
        int done = (int) tasks.stream().filter(task -> task.getStatus() == TaskStatus.COMPLETED).count();
        boolean hasInProgress = tasks.stream().anyMatch(task -> task.getStatus() == TaskStatus.IN_PROGRESS);

        request.setSubTaskCount(total);
        request.setCompletedSubTaskCount(done);
        request.setProgressPercent(total == 0 ? 0d : (done * 100d) / total);

        if (total == 0) {
            request.setStatus(Status.OPEN);
        } else if (done == total) {
            request.setStatus(Status.COMPLETED);
        } else if (hasInProgress || done > 0) {
            request.setStatus(Status.IN_PROGRESS);
        } else {
            request.setStatus(Status.OPEN);
        }

        request.setUpdatedAt(LocalDateTime.now());
        maintenanceRequestRepository.save(request);
    }
}
