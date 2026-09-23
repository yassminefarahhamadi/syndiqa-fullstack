package tn.esprit.pidev.services.IncidentAlert;



import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.apache.catalina.Store;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.pidev.dto.IncidentAlert.*;
import tn.esprit.pidev.entities.IncidentAlert.Incident;
import tn.esprit.pidev.entities.financial.Charge;
import tn.esprit.pidev.entities.financial.ChargeStatus;
import tn.esprit.pidev.entities.user.Account;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.entities.user.Building;
import tn.esprit.pidev.entities.user.StaffProfile;
import tn.esprit.pidev.enums.IncidentAlert.Category;
import tn.esprit.pidev.enums.IncidentAlert.IncidentType;
import tn.esprit.pidev.enums.IncidentAlert.Severity;
import tn.esprit.pidev.enums.IncidentAlert.Status;
import tn.esprit.pidev.repositories.IncidentAlert.IncidentRepository;
import tn.esprit.pidev.repositories.financial.IChargeRepo;
import tn.esprit.pidev.repositories.user.AccountRepository;
import tn.esprit.pidev.repositories.user.StaffProfileRepository;
import tn.esprit.pidev.repositories.user.UserBuildingRepository;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static tn.esprit.pidev.entities.communityevents.AccountStatus.ACTIVE;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final AlertService alertService; // ✅ make it final
    @Value("${app.test.email}")
    private String testEmail;
    @Autowired
    private MailService mailService;
    private final AccountRepository accountRepository; // ✅ final
   private final  StaffProfileRepository  spr;
private final IChargeRepo chargeRepository;
    private final UserBuildingRepository buildingRepository;

    public List<Building> getBuildingsForUser(String userId) {
        Account user = accountRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        return buildingRepository.findByOrganizationId(user.getOrganizationId());
    }

    public Incident assignDomain(String incidentId, String domain) {

        // 1. Get incident
        Incident incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

        // 2. Set domain
        incident.setAssignedDomain(domain);

        // 3. Get staff (role=STAFF, domain=domain, same organization)
        List<StaffProfile> staffList = spr.findByOrganizationIdAndDepartment(incident.getOrganizationId(), domain);

// Send email to each staff
        for (StaffProfile staff : staffList) {

            Optional<Account> accountOpt = accountRepository.findById(staff.getAccountId());

            if (accountOpt.isEmpty()) {
                continue; // skip invalid staff
            }

            Account account = accountOpt.get();

            if (!(account.getStatus() ==ACTIVE)) {
                continue; // skip inactive accounts
            }

            System.out.println( "----hello --- "+ account.getEmail() );
            mailService.sendIncidentEmail(
                account.getEmail(),
                staff.getDepartment(),
                incident.getDescription(),
                incident.getId()
            );
        }

        // 5. Save incident
        return incidentRepository.save(incident);
    }


    // ✅ Take Incident
    public Incident takeIncident(String id, String email) {
        Incident incident = getById(id);

        if (incident.getAssignedTo() != null) {
            throw new IllegalStateException("Already taken by another technician");
        }

        if (!incident.getStatus().equals(Status.NEW)) {
            throw new IllegalStateException("Incident already processed");
        }

        incident.setStatus(Status.TAKEN);
        incident.setAssignedTo(email);

        return incidentRepository.save(incident);
    }

    public Map<String, Object> analyzeVoice(String audioPath) {

        try {
            RestTemplate restTemplate = new RestTemplate();

            String url = "http://127.0.0.1:8000/analyze-audio";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            // ✅ FIX: convert DB path → real file system path
            Path path = Paths.get("uploads/audio")
                .resolve(Paths.get(audioPath).getFileName());

            File file = path.toFile();

            // 🔥 DEBUG (keep this while testing)
            System.out.println("DB audioPath = " + audioPath);
            System.out.println("Resolved file = " + file.getAbsolutePath());
            System.out.println("File exists = " + file.exists());

            if (!file.exists()) {
                throw new RuntimeException("Audio file not found: " + file.getAbsolutePath());
            }

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new FileSystemResource(file));

            HttpEntity<MultiValueMap<String, Object>> request =
                new HttpEntity<>(body, headers);

            ResponseEntity<Map> response =
                restTemplate.postForEntity(url, request, Map.class);

            return response.getBody();

        } catch (Exception e) {
            e.printStackTrace();

            Map<String, Object> error = new HashMap<>();
            error.put("label", "ERROR");
            error.put("message", e.getMessage());
            error.put("confidence", 0);

            return error;
        }
    }

    public Incident createIncident(
        IncidentRequest request,
        List<MultipartFile> files,
        MultipartFile audio
    ) {

        String userId;
        String userEmail;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        userId = auth.getName();

        Account acc = accountRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Authenticated account not found"));

        userEmail = acc.getEmail();

        // ✅ Get all SYNDIC_ADMIN emails
        List<String> adminEmails = accountRepository
            .findByRole(AccountRole.SYNDIC_ADMIN)
            .stream()
            .map(Account::getEmail)
            .toList();

        // ✅ Handle images
        List<String> imagePaths = new ArrayList<>();

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                try {
                    String cleanName = file.getOriginalFilename().replaceAll("\\s+", "_");
                    String fileName = UUID.randomUUID() + "_" + cleanName;

                    Path uploadDir = Paths.get("uploads");
                    if (!Files.exists(uploadDir)) {
                        Files.createDirectories(uploadDir);
                    }

                    Path filePath = uploadDir.resolve(fileName);
                    Files.write(filePath, file.getBytes());

                    imagePaths.add("/uploads/" + fileName);

                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }

        String audioPath = null;

        if (audio != null && !audio.isEmpty()) {
            try {
                String fileName = UUID.randomUUID() + "_" + audio.getOriginalFilename();
                Path uploadDir = Paths.get("uploads/audio");

                if (!Files.exists(uploadDir)) {
                    Files.createDirectories(uploadDir);
                }

                Path filePath = uploadDir.resolve(fileName);
                Files.write(filePath, audio.getBytes());

                audioPath = "/uploads/audio/" + fileName;

            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        // ✅ Create incident
        //
        Incident incident = Incident.builder()
            .type(IncidentType.valueOf(request.getType()))
            .description(request.getDescription())
            .buildingId(request.getBuildingId())
            .organizationId(acc.getOrganizationId())
            .userId(userId)
            .category(Category.valueOf(request.getCategory()))
            .reportedBy(userEmail) // ✅ NEW FIELD
            .userSeverity(Severity.valueOf(request.getUserSeverity()))
            .status(Status.NEW)
            .reportedAt(LocalDateTime.now())
            .evidencePhotos(imagePaths)
            .build();

        // ✅ AI severity
        String aiSeverity = getSeverityFromAI(incident);

        Severity userSev = Severity.valueOf(request.getUserSeverity());
        Severity aiSev = Severity.valueOf(aiSeverity);
        Severity finalSev = userSev.ordinal() > aiSev.ordinal() ? userSev : aiSev;

        incident.setFinalSeverity(finalSev.toString());
        incident.setAiSeverity(aiSeverity);

        incident.setAudioPath(audioPath);

        Incident savedIncident = incidentRepository.save(incident);

        // ✅ SEND EMAILS
        try {
            // 👉 send to admins
           /* for (String email : adminEmails) {
                mailService.sendIncidentEmailHtml(
                    email,
                    "New Incident Reported",
                    incident.getDescription(),
                    finalSev.toString(),
                    incident.getBuildingId(),
                    userEmail
                );
            }*/
            mailService.sendIncidentEmailHtml(
                testEmail,
                "New Incident Reported",
                incident.getDescription(),
                finalSev.toString(),
                incident.getBuildingId(),
                userEmail
            );



        } catch (MessagingException e) {
            e.printStackTrace();
        }

        // ✅ ALERT
        AlertRequest alertRequest = new AlertRequest();
        alertRequest.setIncidentId(savedIncident.getId());
        alertRequest.setMessage("A new incident has been reported: " + savedIncident.getDescription());
        alertService.create(alertRequest);

        return savedIncident;
    }

    public void investigate(String id) {
        Incident incident = incidentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

        incident.setStatus(Status.UNDER_INVESTIGATION);

        incidentRepository.save(incident);
    }

    public void setInProgress(String id) {
        Incident incident = incidentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

        incident.setStatus(Status.IN_PROGRESS);

        incidentRepository.save(incident);
    }


    public void resolve(String id) {
        Incident incident = incidentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

        incident.setStatus(Status.RESOLVED);

        incidentRepository.save(incident);
    }

    public void markFalse(String id) {
        Incident incident = incidentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

        incident.setStatus(Status.FALSE_REPORT);

        incidentRepository.save(incident);
    }

   /* public List<Incident> getAll() {

        List<Incident> incidents = incidentRepository
            .findAll(Sort.by(Sort.Direction.DESC, "reportedAt"));

        for (Incident incident : incidents) {
            Building building = buildingRepository
                .findById(incident.getBuildingId())
                .orElse(null);

            incident.setBuildingName(
                building != null ? building.getName() : "Unknown"
            );
        }

        return incidents;
    }*/

    public List<Incident> getAllByUserOrganization() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        String userId = auth.getName();

        Account account = accountRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Account not found"));

        String orgId = account.getOrganizationId();

        // 1. get buildings of this organization
        List<String> buildingIds = buildingRepository
            .findByOrganizationId(orgId)
            .stream()
            .map(Building::getId)
            .toList();

        // 2. get incidents only for those buildings
        List<Incident> incidents =
            incidentRepository.findByBuildingIdInOrderByReportedAtDesc(buildingIds);

        // 3. enrich building name
        for (Incident incident : incidents) {

            Building building = buildingRepository
                .findById(incident.getBuildingId())
                .orElse(null);

            incident.setBuildingName(
                building != null ? building.getName() : "Unknown"
            );
        }

        return incidents;
    }

    public List<Incident> getByUser(String userId) {

        List<Incident> incidents = incidentRepository.findByUserId(userId);

        for (Incident incident : incidents) {

            Building building = buildingRepository
                .findById(incident.getBuildingId())
                .orElse(null);

            incident.setBuildingName(
                building != null ? building.getName() : "Unknown"
            );
        }

        return incidents;
    }

    public Incident getById(String id) {
        return incidentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident not found"));
    }

    public Incident updateStatus(String id, String status) {
        Incident incident = getById(id);
        incident.setStatus(Status.valueOf(status));
        return incidentRepository.save(incident);
    }

    public void delete(String id) {
        incidentRepository.deleteById(id);
    }

    // ✅ Get incidents by category
    public List<Incident> getByCategory(String category) {
        return incidentRepository.findByCategory(category);
    }



    // ✅ Get incidents by status
    public List<Incident> getByStatus(String status) {
        return incidentRepository.findByStatus(status);
    }

    // ✅ Get incidents by final severity
    public List<Incident> getBySeverity(String severity) {
        return incidentRepository.findByFinalSeverity(severity);
    }



    public String getSeverityFromAI(Incident incident) {

        RestTemplate restTemplate = new RestTemplate();

        String url = "http://127.0.0.1:3001/predict";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("description", incident.getDescription());
        body.put("type", incident.getType() != null ? incident.getType().toString() : "UNKNOWN");

        HttpEntity<Map<String, Object>> request =
            new HttpEntity<>(body, headers);

        ResponseEntity<Map> response =
            restTemplate.postForEntity(url, request, Map.class);

        if (response.getBody() == null || !response.getBody().containsKey("severity")) {
            return "LOW"; // fallback
        }

        return response.getBody().get("severity").toString();
    }

    public long getTotalIncidents() {
        return incidentRepository.count(); // total documents
    }

    public long getCriticalIncidents() {
        return incidentRepository.countByFinalSeverity("CRITICAL");
    }

    public long getMediumIncidents() {
        return incidentRepository.countByFinalSeverity("MEDIUM");
    }

    public long getLowIncidents() {
        return incidentRepository.countByFinalSeverity("LOW");
    }
    public Map<String, Long> getIncidentCounts(String organizationId) {
        Map<String, Long> counts = new HashMap<>();
        
        if (organizationId != null && !organizationId.isEmpty()) {
            List<Incident> orgIncidents = incidentRepository.findByOrganizationId(organizationId);
            counts.put("TOTAL", (long) orgIncidents.size());
            counts.put("CRITICAL", orgIncidents.stream().filter(i -> "CRITICAL".equals(i.getFinalSeverity())).count());
            counts.put("MEDIUM", orgIncidents.stream().filter(i -> "MEDIUM".equals(i.getFinalSeverity())).count());
            counts.put("LOW", orgIncidents.stream().filter(i -> "LOW".equals(i.getFinalSeverity())).count());
        } else {
            counts.put("TOTAL", getTotalIncidents());
            counts.put("CRITICAL", getCriticalIncidents());
            counts.put("MEDIUM", getMediumIncidents());
            counts.put("LOW", getLowIncidents());
        }
        return counts;
    }
    public List<Incident> getResolvedIncidentsForTechnician() {

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();

            if (auth == null || !auth.isAuthenticated()) {
                throw new RuntimeException("User not authenticated");
            }

            String userrid = auth.getName(); // usually email in your setup

            Account account = accountRepository.findById(userrid)
                .orElseThrow(() -> new RuntimeException("Account not found"));
            return incidentRepository.findByAssignedToAndStatus(
                account.getEmail(),
                "RESOLVED"
            );

        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch resolved incidents: " + e.getMessage(), e);
        }
    }
    public Charge generateChargeFromIncident(BillRequest request) {

        // 1. Get incident
        Incident incident = incidentRepository.findById(request.incidentId)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

        // 2. Define pricing logic
        double hourlyRate = 50.0;

        double totalAmount = (request.hours * hourlyRate) + request.materialsCost;

        // 3. Create Charge
        Charge charge = Charge.builder()
            .buildingId(incident.getBuildingId())
            .userId(incident.getUserId()) // resident pays
            .label("Incident: " + incident.getId())
            .amount(totalAmount)
            .dueDate(LocalDate.now().plusDays(7))
            .status(ChargeStatus.PENDING)
            .build();

        return chargeRepository.save(charge);
    }

    public Optional<Charge> getChargeByIncidentId(String incidentId) {

        List<Charge> charges =
            chargeRepository.findAllByLabel("Incident: " + incidentId);

        if (charges == null || charges.isEmpty()) {
            return Optional.empty();
        }

        // return FIRST bill only
        return Optional.of(charges.get(0));
    }






    public Incident rateIncident(String incidentId, Integer rating) {

        Incident incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

        // 🔒 only resolved incidents can be rated
        if (!"RESOLVED".equalsIgnoreCase(String.valueOf(incident.getStatus()))) {
            throw new IllegalStateException("Only resolved incidents can be rated");
        }

        // ⭐ set rating safely
        incident.setRating(rating);

        return incidentRepository.save(incident);
    }



        public StatsOverviewDTO getOverview() {
            long total = incidentRepository.count();
            long resolved = incidentRepository.countByStatus("RESOLVED");
            long pending = total - resolved;

            double rate = total == 0 ? 0 : ((double) resolved / total) * 100;

            StatsOverviewDTO dto = new StatsOverviewDTO();
            dto.setTotal(total);
            dto.setResolved(resolved);
            dto.setPending(pending);
            dto.setResolutionRate(rate);

            return dto;
        }


    public List<WeeklyStatsDTO> getWeeklyStats() {
        List<Incident> incidents = incidentRepository.findAll();

        Map<DayOfWeek, WeeklyStatsDTO> map = new HashMap<>();

        for (Incident i : incidents) {
            DayOfWeek day = i.getReportedAt().getDayOfWeek();

            map.putIfAbsent(day, new WeeklyStatsDTO(day.toString(), 0, 0));

            WeeklyStatsDTO stat = map.get(day);
            stat.setTotal(stat.getTotal() + 1);

            if ("RESOLVED".equals(i.getStatus())) {
                stat.setResolved(stat.getResolved() + 1);
            }
        }

        return new ArrayList<>(map.values());
    }
    public List<CategoryStatsDTO> getCategoryStats() {
        List<Incident> incidents = incidentRepository.findAll();

        Map<IncidentType, Long> map = incidents.stream()
            .collect(Collectors.groupingBy(Incident::getType, Collectors.counting()));

        return map.entrySet().stream()
            .map(e -> new CategoryStatsDTO(e.getKey().name(), e.getValue()))
            .collect(Collectors.toList());

    }

    public Building getBuildingById(String id) {
        return buildingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Building not found with id: " + id));
    }

}

