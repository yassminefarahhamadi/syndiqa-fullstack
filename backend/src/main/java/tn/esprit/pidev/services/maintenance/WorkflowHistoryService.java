package tn.esprit.pidev.services.maintenance;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.maintenance.WorkflowHistory;
import tn.esprit.pidev.repositories.maintenance.WorkflowHistoryRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WorkflowHistoryService {

    private final WorkflowHistoryRepository workflowHistoryRepository;

    public WorkflowHistory create(WorkflowHistory workflowHistory) {
        if (workflowHistory.getTimestamp() == null) {
            workflowHistory.setTimestamp(LocalDateTime.now());
        }

        return workflowHistoryRepository.save(workflowHistory);
    }

    public List<WorkflowHistory> getAll() {
        return workflowHistoryRepository.findAll();
    }

    public Optional<WorkflowHistory> getById(String id) {
        return workflowHistoryRepository.findById(id);
    }

    public Optional<WorkflowHistory> update(String id, WorkflowHistory workflowHistory) {
        return workflowHistoryRepository.findById(id)
                .map(existing -> {
                    workflowHistory.setId(existing.getId());

                    if (workflowHistory.getTimestamp() == null) {
                        workflowHistory.setTimestamp(existing.getTimestamp());
                    }

                    return workflowHistoryRepository.save(workflowHistory);
                });
    }

    public boolean delete(String id) {
        if (!workflowHistoryRepository.existsById(id)) {
            return false;
        }

        workflowHistoryRepository.deleteById(id);
        return true;
    }
}

