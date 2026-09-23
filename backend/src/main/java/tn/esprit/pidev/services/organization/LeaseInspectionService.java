package tn.esprit.pidev.services.organization;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.InspectionComparisonDto;
import tn.esprit.pidev.dto.InspectionItemDto;
import tn.esprit.pidev.dto.ItemComparisonDto;
import tn.esprit.pidev.dto.LeaseInspectionDto;
import tn.esprit.pidev.dto.LeaseInspectionResponseDto;
import tn.esprit.pidev.entities.organization.ActivityType;
import tn.esprit.pidev.entities.organization.InspectionCondition;
import tn.esprit.pidev.entities.organization.InspectionItem;
import tn.esprit.pidev.entities.organization.InspectionType;
import tn.esprit.pidev.entities.organization.LeaseInspection;
import tn.esprit.pidev.entities.organization.LeaseInspectionStatus;
import tn.esprit.pidev.entities.organization.LeaseStatus;
import tn.esprit.pidev.entities.organization.Organization;
import tn.esprit.pidev.repositories.organization.LeaseInspectionRepository;
import tn.esprit.pidev.repositories.organization.LeaseRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaseInspectionService {

    private final LeaseInspectionRepository leaseInspectionRepository;
    private final LeaseRepository leaseRepository;
    private final OrganizationService organizationService;
    private final OrganizationActivityService activityService;

    // ─── CRUD ───────────────────────────────────────────────────────────────────

    public LeaseInspectionResponseDto createInspection(LeaseInspectionDto dto) {
        log.info("Creating new inspection for lease {}", dto.getLeaseId());

        if (leaseRepository.findById(dto.getLeaseId()).isEmpty()) {
            throw new IllegalArgumentException("Bail introuvable avec l'ID : " + dto.getLeaseId());
        }

        // Règle métier #6 : une seule inspection INITIAL autorisée par bail
        if (dto.getInspectionType() == InspectionType.INITIAL) {
            boolean alreadyExists = leaseInspectionRepository
                .existsByLeaseIdAndInspectionType(dto.getLeaseId(), InspectionType.INITIAL);
            if (alreadyExists) {
                throw new IllegalStateException(
                    "Une inspection INITIAL existe déjà pour ce bail. Un seul état des lieux d'entrée est autorisé."
                );
            }
            // Règle métier #A : inspection INITIAL uniquement sur bail PENDING
            leaseRepository.findById(dto.getLeaseId()).ifPresent(lease -> {
                if (lease.getStatus() != LeaseStatus.PENDING) {
                    throw new IllegalStateException(
                        "L'inspection d'entrée (INITIAL) ne peut être créée que sur un bail en attente (PENDING). Statut actuel : " + lease.getStatus()
                    );
                }
            });
        }
        // Règle métier #B : inspection FINAL uniquement sur bail ACTIVE
        if (dto.getInspectionType() == InspectionType.FINAL) {
            leaseRepository.findById(dto.getLeaseId()).ifPresent(lease -> {
                if (lease.getStatus() != LeaseStatus.ACTIVE) {
                    throw new IllegalStateException(
                        "L'inspection de sortie (FINAL) ne peut être créée que sur un bail actif (ACTIVE). Statut actuel : " + lease.getStatus()
                    );
                }
            });
        }

        LeaseInspection inspection = LeaseInspection.builder()
            .leaseId(dto.getLeaseId())
            .apartmentId(dto.getApartmentId())
            .organizationId(dto.getOrganizationId())
            .inspectionType(dto.getInspectionType())
            .inspectorAccountId(dto.getInspectorAccountId())
            .tenantAccountId(dto.getTenantAccountId())
            .managerAccountId(dto.getManagerAccountId())
            .inspectionDate(dto.getInspectionDate())
            .condition(dto.getCondition())
            .overallCondition(dto.getOverallCondition())
            .costsEstimated(dto.getCostsEstimated())
            .reportUrl(dto.getReportUrl())
            .signedBy(dto.getSignedBy())
            .status(dto.getStatus())
            .build();

        if (dto.getItems() != null) {
            inspection.setItems(dto.getItems().stream()
                .map(this::mapDtoToInspectionItem)
                .collect(Collectors.toList()));
        }

        if (dto.getDamagesFound() != null) inspection.setDamagesFound(dto.getDamagesFound());
        if (dto.getPhotosUrls() != null)   inspection.setPhotosUrls(dto.getPhotosUrls());

        LeaseInspection saved = leaseInspectionRepository.save(inspection);
        log.info("Inspection created with id: {}", saved.getId());
        activityService.log(saved.getOrganizationId(), ActivityType.INSPECTION_CREATED,
            "Inspection " + saved.getInspectionType() + " créée",
            saved.getInspectorAccountId(), saved.getId());
        return mapToResponseDto(saved);
    }

    public List<LeaseInspectionResponseDto> getAllInspections() {
        return leaseInspectionRepository.findAll().stream()
            .map(this::mapToResponseDto).collect(Collectors.toList());
    }

    public LeaseInspectionResponseDto getInspectionById(String inspectionId) {
        return leaseInspectionRepository.findById(inspectionId)
            .map(this::mapToResponseDto)
            .orElseThrow(() -> new IllegalArgumentException("Inspection not found with id: " + inspectionId));
    }

    public List<LeaseInspectionResponseDto> getInspectionsByLeaseId(String leaseId) {
        return leaseInspectionRepository.findByLeaseId(leaseId).stream()
            .map(this::mapToResponseDto).collect(Collectors.toList());
    }

    public LeaseInspectionResponseDto getLatestInspection(String leaseId) {
        return leaseInspectionRepository.findFirstByLeaseIdOrderByInspectionDateDesc(leaseId)
            .map(this::mapToResponseDto)
            .orElseThrow(() -> new IllegalArgumentException("No inspections found for lease: " + leaseId));
    }

    public List<LeaseInspectionResponseDto> getInspectionsByApartmentId(String apartmentId) {
        return leaseInspectionRepository.findByApartmentId(apartmentId).stream()
            .map(this::mapToResponseDto).collect(Collectors.toList());
    }

    public List<LeaseInspectionResponseDto> getInspectionsByOrganizationIds(List<String> orgIds) {
        if (orgIds == null || orgIds.isEmpty()) return new ArrayList<>();
        List<LeaseInspection> result = new ArrayList<>(leaseInspectionRepository.findByOrganizationIdIn(orgIds));
        Set<String> found = result.stream().map(LeaseInspection::getId).collect(Collectors.toSet());
        for (String orgId : orgIds) {
            try {
                Organization org = organizationService.getOrganizationById(orgId);
                List<String> memberIds = org.getMemberAccountIds();
                if (memberIds != null && !memberIds.isEmpty()) {
                    leaseInspectionRepository.findByTenantAccountIdIn(memberIds).stream()
                        .filter(i -> !found.contains(i.getId()))
                        .forEach(i -> { result.add(i); found.add(i.getId()); });
                }
            } catch (Exception e) {
                log.warn("Fallback par membres impossible pour org {}: {}", orgId, e.getMessage());
            }
        }
        return result.stream().map(this::mapToResponseDto).collect(Collectors.toList());
    }

    public List<LeaseInspectionResponseDto> getInspectionsByOrganizationId(String organizationId) {
        List<LeaseInspection> byOrg = leaseInspectionRepository.findByOrganizationId(organizationId);
        Set<String> found = byOrg.stream().map(LeaseInspection::getId).collect(Collectors.toSet());
        List<LeaseInspection> result = new ArrayList<>(byOrg);
        try {
            Organization org = organizationService.getOrganizationById(organizationId);
            List<String> memberIds = org.getMemberAccountIds();
            if (memberIds != null && !memberIds.isEmpty()) {
                leaseInspectionRepository.findByTenantAccountIdIn(memberIds).stream()
                    .filter(i -> !found.contains(i.getId()))
                    .forEach(result::add);
            }
        } catch (Exception e) {
            log.warn("Fallback par membres impossible pour org {}: {}", organizationId, e.getMessage());
        }
        return result.stream().map(this::mapToResponseDto).collect(Collectors.toList());
    }

    public List<LeaseInspectionResponseDto> getInspectionsByType(InspectionType inspectionType) {
        return leaseInspectionRepository.findByInspectionType(inspectionType).stream()
            .map(this::mapToResponseDto).collect(Collectors.toList());
    }

    public List<LeaseInspectionResponseDto> getInspectionsByStatus(LeaseInspectionStatus status) {
        return leaseInspectionRepository.findByStatus(status).stream()
            .map(this::mapToResponseDto).collect(Collectors.toList());
    }

    public List<LeaseInspectionResponseDto> getInspectionsByInspector(String inspectorAccountId) {
        return leaseInspectionRepository.findByInspectorAccountId(inspectorAccountId).stream()
            .map(this::mapToResponseDto).collect(Collectors.toList());
    }

    public List<LeaseInspectionResponseDto> getInspectionsByTenantAccountId(String tenantAccountId) {
        return leaseInspectionRepository.findByTenantAccountId(tenantAccountId).stream()
            .map(this::mapToResponseDto).collect(Collectors.toList());
    }

    public List<LeaseInspectionResponseDto> getInspectionsByDateRange(LocalDate from, LocalDate to) {
        return leaseInspectionRepository.findByInspectionDateBetween(from, to).stream()
            .map(this::mapToResponseDto).collect(Collectors.toList());
    }

    public List<LeaseInspectionResponseDto> getOrganizationInspectionsByDateRange(
        String organizationId, LocalDate from, LocalDate to) {
        return leaseInspectionRepository.findByOrganizationIdAndInspectionDateBetween(organizationId, from, to).stream()
            .map(this::mapToResponseDto).collect(Collectors.toList());
    }

    public LeaseInspectionResponseDto updateInspection(String inspectionId, LeaseInspectionDto dto) {
        log.info("Updating inspection with id: {}", inspectionId);

        LeaseInspection inspection = leaseInspectionRepository.findById(inspectionId)
            .orElseThrow(() -> new IllegalArgumentException("Inspection not found with id: " + inspectionId));

        if (dto.getInspectionType()      != null) inspection.setInspectionType(dto.getInspectionType());
        if (dto.getInspectorAccountId()  != null) inspection.setInspectorAccountId(dto.getInspectorAccountId());
        if (dto.getTenantAccountId()     != null) inspection.setTenantAccountId(dto.getTenantAccountId());
        if (dto.getManagerAccountId()    != null) inspection.setManagerAccountId(dto.getManagerAccountId());
        if (dto.getInspectionDate()      != null) inspection.setInspectionDate(dto.getInspectionDate());
        if (dto.getCondition()           != null) inspection.setCondition(dto.getCondition());
        if (dto.getOverallCondition()    != null) inspection.setOverallCondition(dto.getOverallCondition());
        if (dto.getDamagesFound()        != null) inspection.setDamagesFound(dto.getDamagesFound());
        if (dto.getCostsEstimated()      != null) inspection.setCostsEstimated(dto.getCostsEstimated());
        if (dto.getPhotosUrls()          != null) inspection.setPhotosUrls(dto.getPhotosUrls());
        if (dto.getReportUrl()           != null) inspection.setReportUrl(dto.getReportUrl());
        if (dto.getSignedBy()            != null) inspection.setSignedBy(dto.getSignedBy());
        if (dto.getStatus()              != null) inspection.setStatus(dto.getStatus());

        if (dto.getItems() != null) {
            inspection.setItems(dto.getItems().stream()
                .map(this::mapDtoToInspectionItem)
                .collect(Collectors.toList()));
        }

        inspection.setUpdatedAt(Instant.now());
        LeaseInspection updated = leaseInspectionRepository.save(inspection);
        log.info("Inspection updated with id: {}", updated.getId());
        return mapToResponseDto(updated);
    }

    public void deleteInspection(String inspectionId) {
        log.info("Deleting inspection with id: {}", inspectionId);
        if (!leaseInspectionRepository.existsById(inspectionId)) {
            throw new IllegalArgumentException("Inspection not found with id: " + inspectionId);
        }
        leaseInspectionRepository.deleteById(inspectionId);
    }

    public LeaseInspectionResponseDto updateInspectionStatus(String inspectionId, LeaseInspectionStatus status) {
        LeaseInspection inspection = leaseInspectionRepository.findById(inspectionId)
            .orElseThrow(() -> new IllegalArgumentException("Inspection not found with id: " + inspectionId));

        inspection.setStatus(status);
        inspection.setUpdatedAt(Instant.now());
        LeaseInspection updated = leaseInspectionRepository.save(inspection);

        if (status == LeaseInspectionStatus.COMPLETED) {
            activityService.log(updated.getOrganizationId(), ActivityType.INSPECTION_COMPLETED,
                "Inspection " + updated.getInspectionType() + " complétée",
                updated.getInspectorAccountId(), inspectionId);
        } else if (status == LeaseInspectionStatus.DISPUTED) {
            activityService.log(updated.getOrganizationId(), ActivityType.INSPECTION_DISPUTED,
                "Inspection " + updated.getInspectionType() + " contestée",
                updated.getTenantAccountId(), inspectionId);
        }
        return mapToResponseDto(updated);
    }

    public boolean inspectionTypeExistsForLease(String leaseId, InspectionType inspectionType) {
        return leaseInspectionRepository.existsByLeaseIdAndInspectionType(leaseId, inspectionType);
    }

    // ─── Items de l'inspection INITIAL (pré-chargement pour FINAL) ──────────────

    public List<InspectionItemDto> getInitialInspectionItems(String leaseId) {
        return leaseInspectionRepository
            .findByLeaseIdAndInspectionType(leaseId, InspectionType.INITIAL)
            .stream()
            .findFirst()
            .map(i -> i.getItems().stream()
                .map(this::mapInspectionItemToDto)
                .collect(Collectors.toList()))
            .orElse(List.of());
    }

    // ─── Comparaison INITIAL → FINAL ────────────────────────────────────────────

    public InspectionComparisonDto compareInspections(String leaseId) {
        List<LeaseInspection> initialList = leaseInspectionRepository
            .findByLeaseIdAndInspectionType(leaseId, InspectionType.INITIAL);
        List<LeaseInspection> finalList = leaseInspectionRepository
            .findByLeaseIdAndInspectionType(leaseId, InspectionType.FINAL);

        if (initialList.isEmpty()) {
            throw new IllegalStateException("Aucune inspection INITIAL trouvée pour le bail : " + leaseId);
        }
        if (finalList.isEmpty()) {
            throw new IllegalStateException("Aucune inspection FINAL trouvée pour le bail : " + leaseId);
        }

        LeaseInspection initial   = initialList.get(0);
        LeaseInspection finalInsp = finalList.get(0);

        // Map initial items by name (lower case)
        Map<String, InspectionItem> initialMap = initial.getItems().stream()
            .collect(Collectors.toMap(
                item -> item.getItemName().toLowerCase().trim(),
                item -> item,
                (a, b) -> a
            ));

        List<ItemComparisonDto> comparisons = new ArrayList<>();
        BigDecimal totalDeduction = BigDecimal.ZERO;

        // Items présents dans l'inspection FINAL
        Set<String> finalNames = finalInsp.getItems().stream()
            .map(i -> i.getItemName().toLowerCase().trim())
            .collect(Collectors.toSet());

        for (InspectionItem finalItem : finalInsp.getItems()) {
            String key = finalItem.getItemName().toLowerCase().trim();
            InspectionItem initialItem = initialMap.get(key);
            if (initialItem == null) continue; // item ajouté dans le FINAL sans équivalent INITIAL

            int initialScore = conditionToScore(initialItem.getCondition());
            int finalScore   = conditionToScore(finalItem.getCondition());
            int gap          = initialScore - finalScore;
            boolean degraded = gap > 0;
            boolean missing  = finalItem.getCondition() == InspectionCondition.MISSING;

            BigDecimal deduction = calculateDeduction(finalItem, gap);
            totalDeduction = totalDeduction.add(deduction);

            comparisons.add(ItemComparisonDto.builder()
                .itemName(finalItem.getItemName())
                .initialCondition(initialItem.getCondition())
                .finalCondition(finalItem.getCondition())
                .degraded(degraded)
                .missing(missing)
                .degradationGap(gap)
                .estimatedDeduction(deduction)
                .build());
        }

        // Items présents dans INITIAL mais absents du FINAL → considérés MISSING
        for (InspectionItem initialItem : initial.getItems()) {
            String key = initialItem.getItemName().toLowerCase().trim();
            if (!finalNames.contains(key)) {
                int gap = conditionToScore(initialItem.getCondition());
                BigDecimal deduction = calculateDeduction(initialItem, gap);
                totalDeduction = totalDeduction.add(deduction);
                comparisons.add(ItemComparisonDto.builder()
                    .itemName(initialItem.getItemName())
                    .initialCondition(initialItem.getCondition())
                    .finalCondition(InspectionCondition.MISSING)
                    .degraded(true)
                    .missing(true)
                    .degradationGap(gap)
                    .estimatedDeduction(deduction)
                    .build());
            }
        }

        int totalItems    = comparisons.size();
        int degradedItems = (int) comparisons.stream().filter(ItemComparisonDto::isDegraded).count();
        int missingItems  = (int) comparisons.stream().filter(ItemComparisonDto::isMissing).count();
        int degradationScore = totalItems > 0 ? (degradedItems * 100 / totalItems) : 0;

        return InspectionComparisonDto.builder()
            .leaseId(leaseId)
            .initialInspectionId(initial.getId())
            .finalInspectionId(finalInsp.getId())
            .itemComparisons(comparisons)
            .degradationScore(degradationScore)
            .totalEstimatedDeduction(totalDeduction)
            .totalItems(totalItems)
            .degradedItems(degradedItems)
            .missingItems(missingItems)
            .build();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private int conditionToScore(InspectionCondition c) {
        return switch (c) {
            case EXCELLENT -> 5;
            case GOOD      -> 4;
            case ACCEPTABLE -> 3;
            case POOR      -> 2;
            case DAMAGED   -> 1;
            case MISSING   -> 0;
        };
    }

    private BigDecimal calculateDeduction(InspectionItem item, int gap) {
        if (gap <= 0) return BigDecimal.ZERO;
        // Coût manuel (ou IA) saisi par l'inspecteur → priorité absolue
        if (item.getEstimatedRepairCost() != null
            && item.getEstimatedRepairCost().compareTo(BigDecimal.ZERO) > 0) {
            return item.getEstimatedRepairCost();
        }
        // Barème forfaitaire par catégorie
        tn.esprit.pidev.entities.organization.ItemCategory cat =
            item.getCategory() != null
                ? item.getCategory()
                : tn.esprit.pidev.entities.organization.ItemCategory.AUTRE;
        return switch (cat) {
            case ELECTROMENAGER -> switch (gap) {
                case 1 -> BigDecimal.valueOf(300);
                case 2 -> BigDecimal.valueOf(700);
                case 3 -> BigDecimal.valueOf(1500);
                case 4 -> BigDecimal.valueOf(3000);
                default -> BigDecimal.valueOf(5000);
            };
            case MOBILIER -> switch (gap) {
                case 1 -> BigDecimal.valueOf(200);
                case 2 -> BigDecimal.valueOf(500);
                case 3 -> BigDecimal.valueOf(1000);
                case 4 -> BigDecimal.valueOf(2000);
                default -> BigDecimal.valueOf(3500);
            };
            case EQUIPEMENT -> switch (gap) {
                case 1 -> BigDecimal.valueOf(250);
                case 2 -> BigDecimal.valueOf(600);
                case 3 -> BigDecimal.valueOf(1200);
                case 4 -> BigDecimal.valueOf(2500);
                default -> BigDecimal.valueOf(4000);
            };
            case SANITAIRE -> switch (gap) {
                case 1 -> BigDecimal.valueOf(150);
                case 2 -> BigDecimal.valueOf(350);
                case 3 -> BigDecimal.valueOf(700);
                case 4 -> BigDecimal.valueOf(1200);
                default -> BigDecimal.valueOf(2000);
            };
            case MENUISERIE -> switch (gap) {
                case 1 -> BigDecimal.valueOf(200);
                case 2 -> BigDecimal.valueOf(500);
                case 3 -> BigDecimal.valueOf(1000);
                case 4 -> BigDecimal.valueOf(2000);
                default -> BigDecimal.valueOf(3500);
            };
            default -> switch (gap) {
                case 1 -> BigDecimal.valueOf(150);
                case 2 -> BigDecimal.valueOf(400);
                case 3 -> BigDecimal.valueOf(800);
                case 4 -> BigDecimal.valueOf(1500);
                default -> BigDecimal.valueOf(2500);
            };
        };
    }

    // ─── Mappers ─────────────────────────────────────────────────────────────────

    private LeaseInspectionResponseDto mapToResponseDto(LeaseInspection inspection) {
        return LeaseInspectionResponseDto.builder()
            .id(inspection.getId())
            .leaseId(inspection.getLeaseId())
            .apartmentId(inspection.getApartmentId())
            .organizationId(inspection.getOrganizationId())
            .inspectionType(inspection.getInspectionType())
            .inspectorAccountId(inspection.getInspectorAccountId())
            .tenantAccountId(inspection.getTenantAccountId())
            .managerAccountId(inspection.getManagerAccountId())
            .inspectionDate(inspection.getInspectionDate())
            .condition(inspection.getCondition())
            .items(inspection.getItems() == null ? List.of() :
                inspection.getItems().stream()
                    .map(this::mapInspectionItemToDto)
                    .collect(Collectors.toList()))
            .overallCondition(inspection.getOverallCondition())
            .damagesFound(inspection.getDamagesFound())
            .costsEstimated(inspection.getCostsEstimated())
            .photosUrls(inspection.getPhotosUrls())
            .reportUrl(inspection.getReportUrl())
            .signedBy(inspection.getSignedBy())
            .status(inspection.getStatus())
            .createdAt(inspection.getCreatedAt())
            .updatedAt(inspection.getUpdatedAt())
            .build();
    }

    private InspectionItemDto mapInspectionItemToDto(InspectionItem item) {
        return InspectionItemDto.builder()
            .id(item.getId())
            .itemName(item.getItemName())
            .category(item.getCategory())
            .condition(item.getCondition())
            .notes(item.getNotes())
            .photosUrls(item.getPhotosUrls() != null ? item.getPhotosUrls() : new ArrayList<>())
            .estimatedRepairCost(item.getEstimatedRepairCost())
            .aiAnalyzed(item.isAiAnalyzed())
            .build();
    }

    private InspectionItem mapDtoToInspectionItem(InspectionItemDto dto) {
        return InspectionItem.builder()
            .id(dto.getId() != null ? dto.getId() : UUID.randomUUID().toString())
            .itemName(dto.getItemName())
            .category(dto.getCategory() != null ? dto.getCategory() : tn.esprit.pidev.entities.organization.ItemCategory.AUTRE)
            .condition(dto.getCondition())
            .notes(dto.getNotes())
            .photosUrls(dto.getPhotosUrls() != null ? dto.getPhotosUrls() : new ArrayList<>())
            .estimatedRepairCost(dto.getEstimatedRepairCost())
            .aiAnalyzed(dto.isAiAnalyzed())
            .build();
    }
}
