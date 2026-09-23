package tn.esprit.pidev.controllers.maintenance;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.maintenance.WorkflowHistory;
import tn.esprit.pidev.services.maintenance.WorkflowHistoryService;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance/workflow-histories")
@RequiredArgsConstructor
public class WorkflowHistoryController {

    private final WorkflowHistoryService workflowHistoryService;

    @PostMapping
    public ResponseEntity<WorkflowHistory> create(@RequestBody WorkflowHistory workflowHistory) {
        WorkflowHistory created = workflowHistoryService.create(workflowHistory);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<WorkflowHistory>> getAll() {
        return ResponseEntity.ok(workflowHistoryService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkflowHistory> getById(@PathVariable String id) {
        return workflowHistoryService.getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkflowHistory> update(@PathVariable String id,
                                                  @RequestBody WorkflowHistory workflowHistory) {
        return workflowHistoryService.update(id, workflowHistory)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        boolean deleted = workflowHistoryService.delete(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}

