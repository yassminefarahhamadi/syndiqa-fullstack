package tn.esprit.pidev.controllers.maintenance;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.maintenance.MaintenanceTask;
import tn.esprit.pidev.services.maintenance.MaintenanceTaskService;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance/requests/{requestId}/tasks")
@RequiredArgsConstructor
public class MaintenanceRequestTaskController {

    private final MaintenanceTaskService maintenanceTaskService;

    @GetMapping
    public ResponseEntity<List<MaintenanceTask>> getByRequestId(@PathVariable String requestId, HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        String role = (String) request.getAttribute("role");
        String accountId = (String) request.getAttribute("accountId");
        return ResponseEntity.ok(maintenanceTaskService.getByRequestId(requestId, organizationId, role, accountId));
    }

    @PostMapping
    public ResponseEntity<MaintenanceTask> createForRequest(
        @PathVariable String requestId,
        @RequestBody MaintenanceTask task,
        HttpServletRequest request
    ) {
        String organizationId = (String) request.getAttribute("organizationId");
        String role = (String) request.getAttribute("role");
        String accountId = (String) request.getAttribute("accountId");

        MaintenanceTask created = maintenanceTaskService.createForRequest(requestId, task, organizationId, role, accountId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
