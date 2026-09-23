package tn.esprit.pidev.controllers.maintenance;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import tn.esprit.pidev.entities.maintenance.MaintenanceRequest;
import tn.esprit.pidev.services.maintenance.MaintenanceRequestService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/maintenance/requests")
@RequiredArgsConstructor
public class MaintenanceRequestController {

    private final MaintenanceRequestService maintenanceRequestService;
    private final ObjectMapper objectMapper;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.upload.base-url:http://localhost:8089/uploads}")
    private String baseUrl;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MaintenanceRequest> createWithPhoto(
            @RequestPart("request") String requestJson,
            @RequestPart(value = "beforePhoto", required = true) MultipartFile beforePhoto,
            HttpServletRequest request) throws IOException {

        MaintenanceRequest maintenanceRequest = objectMapper.readValue(requestJson, MaintenanceRequest.class);

        // Upload the before photo
        Path uploadPath = Paths.get(uploadDir, "maintenance");
        Files.createDirectories(uploadPath);

        String originalName = beforePhoto.getOriginalFilename() != null ? beforePhoto.getOriginalFilename() : "before.jpg";
        String extension = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf("."))
                : ".jpg";
        String filename = UUID.randomUUID() + "_before" + extension;

        Path target = uploadPath.resolve(filename);
        Files.copy(beforePhoto.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String beforeImageUrl = baseUrl + "/maintenance/" + filename;
        maintenanceRequest.setBeforeImageUrl(beforeImageUrl);
        log.info("Before photo uploaded: {}", beforeImageUrl);

        String organizationId = (String) request.getAttribute("organizationId");
        String accountId = (String) request.getAttribute("accountId");
        String role = (String) request.getAttribute("role");
        MaintenanceRequest created = maintenanceRequestService.create(maintenanceRequest, organizationId, accountId, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MaintenanceRequest> create(@RequestBody MaintenanceRequest maintenanceRequest,
                                                     HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        String accountId = (String) request.getAttribute("accountId");
        String role = (String) request.getAttribute("role");
        MaintenanceRequest created = maintenanceRequestService.create(maintenanceRequest, organizationId, accountId, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<MaintenanceRequest>> getAll(HttpServletRequest request) {
        String organizationId = (String) request.getAttribute("organizationId");
        String role = (String) request.getAttribute("role");
        String accountId = (String) request.getAttribute("accountId");
        return ResponseEntity.ok(maintenanceRequestService.getAll(organizationId, role, accountId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceRequest> getById(@PathVariable String id) {
        return maintenanceRequestService.getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaintenanceRequest> update(@PathVariable String id,
                                                     @RequestBody MaintenanceRequest maintenanceRequest,
                                                     HttpServletRequest request) {
        String accountId = (String) request.getAttribute("accountId");
        return maintenanceRequestService.update(id, maintenanceRequest, accountId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        boolean deleted = maintenanceRequestService.delete(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}

