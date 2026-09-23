package tn.esprit.pidev.controllers.IncidentAlert;


import lombok.RequiredArgsConstructor;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import tn.esprit.pidev.dto.IncidentAlert.*;
import tn.esprit.pidev.entities.IncidentAlert.Incident;
import tn.esprit.pidev.entities.financial.Charge;
import tn.esprit.pidev.entities.user.Account;
import tn.esprit.pidev.entities.user.Building;
import tn.esprit.pidev.repositories.user.AccountRepository;
import tn.esprit.pidev.services.IncidentAlert.IncidentService;
import tn.esprit.pidev.services.user.AuthService;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;
    private final AccountRepository accountRepository;

    @GetMapping("/my-buildings")
    public List<Building> getMyBuildings(Authentication auth) {
        String userId = auth.getName();
        return incidentService.getBuildingsForUser(userId);
    }
    @GetMapping("/technician/bill/{incidentId}")
    public ResponseEntity<Charge> getBill(@PathVariable String incidentId) {

        Optional<Charge> charge = incidentService.getChargeByIncidentId(incidentId);

        if (charge.isPresent()) {
            return ResponseEntity.ok(charge.get()); // ✅ 200
        } else {
            return ResponseEntity.notFound().build(); // ✅ 404
        }
    }
    @PostMapping("/incident-charge")
    public Charge createCharge(@RequestBody BillRequest request) {
        return incidentService.generateChargeFromIncident(request);
    }

    @GetMapping("/technician/resolved")
    public List<Incident> getResolvedForTechnician() {
        return incidentService.getResolvedIncidentsForTechnician();
    }

    @PutMapping("/{id}/assign-domain")
    public Incident assignDomain(@PathVariable String id, @RequestParam String domain) {
        return incidentService.assignDomain(id, domain);
    }

    @PutMapping("/{id}/take")
    public ResponseEntity<?> takeIncident(@PathVariable String id,
                                          @RequestParam String email) {
        try {
            Incident incident = incidentService.takeIncident(id, email);
            return ResponseEntity.ok(incident);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/{id}/analyze-audio")
    public ResponseEntity<?> analyzeIncidentAudio(@PathVariable String id) {

        Incident incident = incidentService.getById(id);

        if (incident.getAudioPath() == null) {
            return ResponseEntity.badRequest().body("No audio found");
        }

        Map<String, Object> result =
                incidentService.analyzeVoice(incident.getAudioPath());

        return ResponseEntity.ok(result);
    }

    // ✅ Create Incident
    @PostMapping(consumes = "multipart/form-data")
    public Incident create(
            @RequestPart("data") IncidentRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestPart(value = "audio", required = false) MultipartFile audio
    ) {
        String userId = "mock-user"; // 🔐 replace with JWT later

        return incidentService.createIncident(request, files, audio);
    }

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads").resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            // Detect file type automatically
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);

        } catch (Exception e) {
            e.printStackTrace(); // helps debugging
            return ResponseEntity.internalServerError().build();
        }
    }

    // ✅ Get all incidents
    @GetMapping
    public List<Incident> getAll() {
       // return incidentService.getAll();
        return incidentService.getAllByUserOrganization();
    }

    // ✅ Get incident by ID
    // ✅ Get incident by ID
    @GetMapping("/{id}")
    public Incident getById(@PathVariable String id) {
        return incidentService.getById(id);
    }
    // ✅ Update status
    @PutMapping("/{id}/status")
    public Incident updateStatus(@PathVariable String id,
                                 @RequestParam String status) {
        return incidentService.updateStatus(id, status);
    }

    // ✅ Delete incident
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        incidentService.delete(id);
    }

    // ✅ Get incidents by category
    @GetMapping("/category/{category}")
    public List<Incident> getByCategory(@PathVariable String category) {
        return incidentService.getByCategory(category);
    }

    // ✅ Get incidents by user
    @GetMapping("/my")
    public List<Incident> getMyIncidents() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        String userid = auth.getName(); // this is email


        return incidentService.getByUser(userid);
    }

    // ✅ Get incidents by status
    @GetMapping("/status/{status}")
    public List<Incident> getByStatus(@PathVariable String status) {
        return incidentService.getByStatus(status);
    }

    // ✅ Get incidents by severity
    @GetMapping("/severity/{severity}")
    public List<Incident> getBySeverity(@PathVariable String severity) {
        return incidentService.getBySeverity(severity);
    }



    // 🔍 UNDER INVESTIGATION
    @PutMapping("/{id}/investigate")
    public ResponseEntity<?> investigate(@PathVariable String id) {
        incidentService.investigate(id);
        return ResponseEntity.ok("Incident is now under investigation");
    }

    // ✅ RESOLVE
    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolve(@PathVariable String id) {
        incidentService.resolve(id);
        return ResponseEntity.ok("Incident resolved successfully");
    }

    // 🚫 FALSE REPORT
    @PutMapping("/{id}/false")
    public ResponseEntity<?> markFalse(@PathVariable String id) {
        incidentService.markFalse(id);
        return ResponseEntity.ok("Incident marked as false report");
    }
    @GetMapping("/counts")
    public ResponseEntity<Map<String, Long>> getIncidentCounts(jakarta.servlet.http.HttpServletRequest request) {
        String role = (String) request.getAttribute("role");
        String orgId = (String) request.getAttribute("organizationId");
        
        Map<String, Long> counts;
        if ("SYNDIC_ADMIN".equals(role)) {
            counts = incidentService.getIncidentCounts(orgId);
        } else {
            counts = incidentService.getIncidentCounts(null);
        }
        return ResponseEntity.ok(counts);
    }

    @PutMapping("/{id}/in-progress")
    public ResponseEntity<?> setInProgress(@PathVariable String id) {
        incidentService.setInProgress(id);
        return ResponseEntity.ok("Incident is now under investigation");
    }


    @PutMapping("/{incidentId}/rate")
    public ResponseEntity<?> rateIncident(
        @PathVariable String incidentId,
        @RequestBody Map<String, Integer> requestBody) {

        Integer rating = requestBody.get("rating");

        if (rating == null || rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body("Rating must be between 1 and 5");
        }

        try {
            Incident updatedIncident = incidentService.rateIncident(incidentId, rating);

            return ResponseEntity.ok(Map.of(
                "message", "Incident rated successfully",
                "incidentId", incidentId,
                "rating", rating,
                "status", updatedIncident.getStatus()
            ));

        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (Exception e) {
            e.printStackTrace(); // 🔥 IMPORTANT for debugging
            return ResponseEntity.status(500).body("Backend error: " + e.getMessage());
        }
    }

    @GetMapping("/overview")
    public StatsOverviewDTO getOverview() {
        return incidentService.getOverview();
    }

    @GetMapping("/weekly")
    public List<WeeklyStatsDTO> getWeekly() {
        return incidentService.getWeeklyStats();
    }

    @GetMapping("/category")
    public List<CategoryStatsDTO> getCategory() {
        return incidentService.getCategoryStats();
    }

@GetMapping("buildingg/{id}")
public Building getBuildingById(@PathVariable String id) {
    return incidentService.getBuildingById(id);
}

}


