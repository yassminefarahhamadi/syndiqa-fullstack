package tn.esprit.pidev.controllers.maintenance;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.pidev.dto.maintenance.MaintenanceAiComparisonResult;
import tn.esprit.pidev.entities.maintenance.MaintenanceRequest;
import tn.esprit.pidev.entities.maintenance.MaintenanceTask;
import tn.esprit.pidev.entities.maintenance.TaskStatus;
import tn.esprit.pidev.repositories.maintenance.MaintenanceRequestRepository;
import tn.esprit.pidev.repositories.maintenance.MaintenanceTaskRepository;
import tn.esprit.pidev.services.maintenance.MaintenanceAiService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/maintenance/tasks")
@RequiredArgsConstructor
public class MaintenanceCompletionController {

    private final MaintenanceTaskRepository maintenanceTaskRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final MaintenanceAiService maintenanceAiService;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.upload.base-url:http://localhost:8089/uploads}")
    private String baseUrl;

    /**
     * Upload an "after" photo for a task and run AI comparison.
     * Does NOT auto-complete the task — the frontend decides based on the score.
     */
    @PostMapping(value = "/{taskId}/complete-with-photo", consumes = "multipart/form-data")
    public ResponseEntity<MaintenanceAiComparisonResult> completeWithPhoto(
            @PathVariable String taskId,
            @RequestParam("afterPhoto") MultipartFile afterPhoto,
            HttpServletRequest request
    ) throws IOException {

        // 1. Find the task
        Optional<MaintenanceTask> taskOpt = maintenanceTaskRepository.findById(taskId);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        MaintenanceTask task = taskOpt.get();

        // 2. Find the parent request (to get beforeImageUrl)
        Optional<MaintenanceRequest> requestOpt = maintenanceRequestRepository.findById(task.getMaintenanceRequestId());
        if (requestOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        MaintenanceRequest maintenanceRequest = requestOpt.get();

        String beforeImageUrl = maintenanceRequest.getBeforeImageUrl();
        if (beforeImageUrl == null || beforeImageUrl.isBlank()) {
            // No before image — cannot compare
            MaintenanceAiComparisonResult errorResult = new MaintenanceAiComparisonResult();
            errorResult.setTaskId(taskId);
            errorResult.setScore(0);
            errorResult.setConclusion("No 'before' image found on the maintenance request. Cannot perform AI comparison.");
            errorResult.setApproved(false);
            return ResponseEntity.ok(errorResult);
        }

        // 3. Upload the "after" photo
        Path uploadPath = Paths.get(uploadDir, "maintenance");
        Files.createDirectories(uploadPath);

        String originalName = afterPhoto.getOriginalFilename() != null ? afterPhoto.getOriginalFilename() : "after.jpg";
        String extension = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf("."))
                : ".jpg";
        String filename = UUID.randomUUID() + "_after" + extension;

        Path target = uploadPath.resolve(filename);
        Files.copy(afterPhoto.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String afterImageUrl = baseUrl + "/maintenance/" + filename;

        // 4. Save the after image URL on the task
        task.setAfterImageUrl(afterImageUrl);
        task.setUpdatedAt(LocalDateTime.now());
        maintenanceTaskRepository.save(task);

        // 5. Call AI comparison
        String issueDescription = maintenanceRequest.getTitle() + " - " + (maintenanceRequest.getDescription() != null ? maintenanceRequest.getDescription() : "");
        MaintenanceAiComparisonResult result = maintenanceAiService.compareBeforeAfter(
                taskId, beforeImageUrl, afterImageUrl, issueDescription
        );

        // 6. Save AI results on the task
        task.setAiComparisonScore(result.getScore());
        task.setAiComparisonConclusion(result.getConclusion());
        task.setAiApproved(result.isApproved());
        maintenanceTaskRepository.save(task);

        return ResponseEntity.ok(result);
    }

    /**
     * Confirm task completion (called after AI comparison, regardless of score).
     * Allows force-completion even if AI score < 90%.
     */
    @PostMapping("/{taskId}/confirm-completion")
    public ResponseEntity<MaintenanceTask> confirmCompletion(
            @PathVariable String taskId,
            HttpServletRequest request
    ) {
        Optional<MaintenanceTask> taskOpt = maintenanceTaskRepository.findById(taskId);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        MaintenanceTask task = taskOpt.get();
        task.setStatus(TaskStatus.COMPLETED);
        task.setCompletedDate(LocalDate.now());
        task.setUpdatedAt(LocalDateTime.now());
        MaintenanceTask saved = maintenanceTaskRepository.save(task);

        // Refresh parent request progress
        maintenanceRequestRepository.findById(task.getMaintenanceRequestId())
                .ifPresent(req -> {
                    var tasks = maintenanceTaskRepository.findByMaintenanceRequestIdOrderByOrderIndexAsc(req.getId());
                    int total = tasks.size();
                    int done = (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
                    req.setSubTaskCount(total);
                    req.setCompletedSubTaskCount(done);
                    req.setProgressPercent(total == 0 ? 0d : (done * 100d) / total);

                    if (total == 0) {
                        req.setStatus(tn.esprit.pidev.entities.maintenance.Status.OPEN);
                    } else if (done == total) {
                        req.setStatus(tn.esprit.pidev.entities.maintenance.Status.COMPLETED);
                    } else if (done > 0) {
                        req.setStatus(tn.esprit.pidev.entities.maintenance.Status.IN_PROGRESS);
                    }

                    req.setUpdatedAt(LocalDateTime.now());
                    maintenanceRequestRepository.save(req);
                });

        return ResponseEntity.ok(saved);
    }
}
