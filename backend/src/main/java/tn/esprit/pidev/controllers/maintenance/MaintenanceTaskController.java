package tn.esprit.pidev.controllers.maintenance;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.dto.maintenance.AssignableStaffOption;
import tn.esprit.pidev.entities.maintenance.MaintenanceTask;
import tn.esprit.pidev.services.maintenance.MaintenanceTaskService;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance/tasks")
@RequiredArgsConstructor
public class MaintenanceTaskController {

    private final MaintenanceTaskService maintenanceTaskService;

    @PostMapping
    public ResponseEntity<MaintenanceTask> create(@RequestBody MaintenanceTask maintenanceTask, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        String role = (String) request.getAttribute("role");
        String accountId = (String) request.getAttribute("accountId");
        MaintenanceTask created = maintenanceTaskService.createForRequest(
            maintenanceTask.getMaintenanceRequestId(),
            maintenanceTask,
            organizationId,
            role,
            accountId
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<MaintenanceTask>> getAll(HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        String role = (String) request.getAttribute("role");
        String accountId = (String) request.getAttribute("accountId");
        return ResponseEntity.ok(maintenanceTaskService.getAll(organizationId, role, accountId));
    }

    @GetMapping("/assignable-staff")
    public ResponseEntity<List<AssignableStaffOption>> getAssignableStaff(HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        return ResponseEntity.ok(maintenanceTaskService.getAssignableStaffOptions(organizationId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceTask> getById(@PathVariable String id, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        String role = (String) request.getAttribute("role");
        String accountId = (String) request.getAttribute("accountId");
        return maintenanceTaskService.getById(id, organizationId, role, accountId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaintenanceTask> update(@PathVariable String id,
                                                  @RequestBody MaintenanceTask maintenanceTask,
                                                  HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        String role = (String) request.getAttribute("role");
        String accountId = (String) request.getAttribute("accountId");
        return maintenanceTaskService.update(id, maintenanceTask, organizationId, role, accountId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        String role = (String) request.getAttribute("role");
        String accountId = (String) request.getAttribute("accountId");
        boolean deleted = maintenanceTaskService.delete(id, organizationId, role, accountId);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}

