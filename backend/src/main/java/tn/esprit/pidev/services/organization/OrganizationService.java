package tn.esprit.pidev.services.organization;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.OrganizationStatsDto;
import tn.esprit.pidev.entities.organization.ActivityType;
import tn.esprit.pidev.entities.organization.InspectionType;
import tn.esprit.pidev.entities.organization.LeaseInspectionStatus;
import tn.esprit.pidev.entities.organization.LeaseStatus;
import tn.esprit.pidev.entities.organization.Organization;
import tn.esprit.pidev.entities.organization.OrganizationStatus;
import tn.esprit.pidev.entities.user.SubscriptionPlan;
import tn.esprit.pidev.repositories.organization.LeaseInspectionRepository;
import tn.esprit.pidev.repositories.organization.LeaseRepository;
import tn.esprit.pidev.repositories.organization.OrganizationRepository;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final LeaseRepository leaseRepository;
    private final LeaseInspectionRepository leaseInspectionRepository;
    private final OrganizationActivityService activityService;

    // ─── CRUD ───────────────────────────────────────────────────────────────────

    public Organization createOrganization(Organization organization) {
        if (organization == null) {
            log.warn("Tentative de création d'une organization null");
            throw new IllegalArgumentException("Organization ne peut pas être null");
        }

        if (organization.getName() == null || organization.getName().isBlank()) {
            log.warn("Tentative de création d'une organization sans nom");
            throw new IllegalArgumentException("Le nom de l'organization est obligatoire");
        }

        if (organizationRepository.existsByName(organization.getName())) {
            log.warn("Tentative de création d'une organization avec un nom existant: {}", organization.getName());
            throw new IllegalArgumentException(
                "Organization avec le nom '" + organization.getName() + "' existe déjà."
            );
        }

        log.info("Création d'une nouvelle organization: {}", organization.getName());
        Organization saved = organizationRepository.save(organization);
        activityService.log(saved.getId(), ActivityType.ORGANIZATION_CREATED,
            "Organisation créée : " + saved.getName());
        return saved;
    }

    public List<Organization> getAllOrganizations() {
        log.debug("Récupération de toutes les organizations");
        return organizationRepository.findAll();
    }

    public Organization getOrganizationById(String id) {
        if (id == null || id.isBlank()) {
            log.warn("Tentative de récupération d'une organization avec un id null/vide");
            throw new IllegalArgumentException("L'ID de l'organization ne peut pas être null ou vide");
        }

        log.debug("Recherche de l'organization par ID: {}", id);
        return organizationRepository.findById(id)
            .orElseThrow(() -> {
                log.warn("Organization non trouvée avec l'ID: {}", id);
                return new IllegalArgumentException("Organization non trouvée avec l'ID: " + id);
            });
    }

    public Organization updateOrganization(String id, Organization updated) {
        if (updated == null) {
            log.warn("Tentative de mise à jour d'une organization avec un objet null");
            throw new IllegalArgumentException("L'objet Organization ne peut pas être null");
        }

        Organization existing = getOrganizationById(id);

        // Mise à jour avec validation null
        if (updated.getName() != null && !updated.getName().isBlank()) {
            log.debug("Mise à jour du nom de l'organization {} : {} -> {}", id, existing.getName(), updated.getName());
            existing.setName(updated.getName());
        }

        if (updated.getAddress() != null && !updated.getAddress().isBlank()) {
            existing.setAddress(updated.getAddress());
        }

        if (updated.getCity() != null && !updated.getCity().isBlank()) {
            existing.setCity(updated.getCity());
        }

        if (updated.getManagerAccountId() != null && !updated.getManagerAccountId().isBlank()) {
            existing.setManagerAccountId(updated.getManagerAccountId());
        }

        log.info("Mise à jour réussie de l'organization: {}", id);
        return organizationRepository.save(existing);
    }

    public void deleteOrganization(String id) {
        // Vérifier l'existence de l'organization
        getOrganizationById(id);

        // Règle métier #13 : impossible de supprimer une organisation avec des baux actifs
        long activeLeasesCount = leaseRepository.countByOrganizationIdAndStatus(id, LeaseStatus.ACTIVE);
        if (activeLeasesCount > 0) {
            throw new IllegalStateException(
                "Impossible de supprimer cette organisation : " + activeLeasesCount +
                " bail(s) actif(s) en cours. Résiliez ou expirez tous les baux avant la suppression."
            );
        }

        log.info("Suppression de l'organization: {}", id);
        organizationRepository.deleteById(id);
    }

    // ─── Status management ──────────────────────────────────────────────────────

    public Organization suspendOrganization(String id) {
        Organization org = getOrganizationById(id);
        org.setStatus(OrganizationStatus.SUSPENDED);
        log.info("Suspension de l'organization: {}", id);
        Organization saved = organizationRepository.save(org);
        activityService.log(id, ActivityType.ORGANIZATION_SUSPENDED, "Organisation suspendue");
        return saved;
    }

    public Organization activateOrganization(String id) {
        Organization org = getOrganizationById(id);
        org.setStatus(OrganizationStatus.ACTIVE);
        log.info("Activation de l'organization: {}", id);
        Organization saved = organizationRepository.save(org);
        activityService.log(id, ActivityType.ORGANIZATION_ACTIVATED, "Organisation activée");
        return saved;
    }

    public List<Organization> getOrganizationsByStatus(OrganizationStatus status) {
        if (status == null) {
            log.warn("Tentative de recherche avec un status null");
            throw new IllegalArgumentException("Le status ne peut pas être null");
        }
        log.debug("Recherche des organizations avec le status: {}", status);
        return organizationRepository.findByStatus(status);
    }

    // ─── Subscription ───────────────────────────────────────────────────────────

    public Organization updateSubscriptionPlan(String id, SubscriptionPlan plan) {
        if (plan == null) {
            log.warn("Tentative de mise à jour du plan avec un plan null");
            throw new IllegalArgumentException("Le plan de subscription ne peut pas être null");
        }
        Organization org = getOrganizationById(id);
        org.setSubscriptionPlan(plan);
        log.info("Mise à jour du plan de subscription de l'organization {}: {}", id, plan);
        Organization saved = organizationRepository.save(org);
        activityService.log(id, ActivityType.SUBSCRIPTION_CHANGED, "Plan d'abonnement modifié : " + plan);
        return saved;
    }

    // ─── Members ────────────────────────────────────────────────────────────────

    public Organization addMember(String orgId, String accountId) {
        if (accountId == null || accountId.isBlank()) {
            log.warn("Tentative d'ajout d'un membre avec un ID null/vide");
            throw new IllegalArgumentException("L'ID du compte ne peut pas être null ou vide");
        }

        Organization org = getOrganizationById(orgId);
        if (!org.getMemberAccountIds().contains(accountId)) {
            org.getMemberAccountIds().add(accountId);
            log.info("Ajout du membre {} à l'organization {}", accountId, orgId);
            organizationRepository.save(org);
            activityService.log(orgId, ActivityType.MEMBER_ADDED,
                "Membre ajouté : " + accountId, null, accountId);
        } else {
            log.debug("Le compte {} est déjà membre de l'organization {}", accountId, orgId);
        }
        return org;
    }

    public Organization removeMember(String orgId, String accountId) {
        if (accountId == null || accountId.isBlank()) {
            log.warn("Tentative de suppression d'un membre avec un ID null/vide");
            throw new IllegalArgumentException("L'ID du compte ne peut pas être null ou vide");
        }

        Organization org = getOrganizationById(orgId);
        if (org.getMemberAccountIds().remove(accountId)) {
            log.info("Suppression du membre {} de l'organization {}", accountId, orgId);
            organizationRepository.save(org);
            activityService.log(orgId, ActivityType.MEMBER_REMOVED,
                "Membre retiré : " + accountId, null, accountId);
        } else {
            log.debug("Le compte {} n'est pas membre de l'organization {}", accountId, orgId);
        }
        return org;
    }

    public List<Organization> getOrganizationsByMember(String accountId) {
        if (accountId == null || accountId.isBlank()) {
            log.warn("Tentative de recherche par membre avec un ID null/vide");
            throw new IllegalArgumentException("L'ID du compte ne peut pas être null ou vide");
        }
        log.debug("Recherche des organizations du membre: {}", accountId);
        return organizationRepository.findByMemberAccountIdsContaining(accountId);
    }

    // ─── Buildings ──────────────────────────────────────────────────────────────

    public Organization addBuilding(String orgId, String buildingId) {
        if (buildingId == null || buildingId.isBlank()) {
            log.warn("Tentative d'ajout d'un bâtiment avec un ID null/vide");
            throw new IllegalArgumentException("L'ID du bâtiment ne peut pas être null ou vide");
        }

        Organization org = getOrganizationById(orgId);
        if (!org.getBuildingIds().contains(buildingId)) {
            org.getBuildingIds().add(buildingId);
            log.info("Ajout du bâtiment {} à l'organization {}", buildingId, orgId);
            organizationRepository.save(org);
            activityService.log(orgId, ActivityType.BUILDING_ADDED,
                "Bâtiment ajouté : " + buildingId, null, buildingId);
        } else {
            log.debug("Le bâtiment {} est déjà associé à l'organization {}", buildingId, orgId);
        }
        return org;
    }

    public Organization removeBuilding(String orgId, String buildingId) {
        if (buildingId == null || buildingId.isBlank()) {
            log.warn("Tentative de suppression d'un bâtiment avec un ID null/vide");
            throw new IllegalArgumentException("L'ID du bâtiment ne peut pas être null ou vide");
        }

        Organization org = getOrganizationById(orgId);
        if (org.getBuildingIds().remove(buildingId)) {
            log.info("Suppression du bâtiment {} de l'organization {}", buildingId, orgId);
            organizationRepository.save(org);
            activityService.log(orgId, ActivityType.BUILDING_REMOVED,
                "Bâtiment retiré : " + buildingId, null, buildingId);
        } else {
            log.debug("Le bâtiment {} n'est pas associé à l'organization {}", buildingId, orgId);
        }
        return org;
    }

    // ─── Manager ────────────────────────────────────────────────────────────────

    // ─── Stats Dashboard ────────────────────────────────────────────────────────

    public OrganizationStatsDto getStatsSummary(List<String> orgIds) {
        if (orgIds == null || orgIds.isEmpty()) {
            return OrganizationStatsDto.builder().build();
        }

        var orgs        = organizationRepository.findAllById(orgIds);
        var leases      = leaseRepository.findByOrganizationIdIn(orgIds);
        var inspections = leaseInspectionRepository.findByOrganizationIdIn(orgIds);

        LocalDate today    = LocalDate.now();
        LocalDate in30Days = today.plusDays(30);

        return OrganizationStatsDto.builder()
            .totalOrganizations(orgs.size())
            .totalMembers(orgs.stream()
                .mapToLong(o -> o.getMemberAccountIds() != null ? o.getMemberAccountIds().size() : 0)
                .sum())
            .totalBuildings(orgs.stream()
                .mapToLong(o -> o.getBuildingIds() != null ? o.getBuildingIds().size() : 0)
                .sum())
            .totalLeases(leases.size())
            .activeLeases(leases.stream().filter(l -> l.getStatus() == LeaseStatus.ACTIVE).count())
            .pendingLeases(leases.stream().filter(l -> l.getStatus() == LeaseStatus.PENDING).count())
            .terminatedLeases(leases.stream().filter(l -> l.getStatus() == LeaseStatus.TERMINATED).count())
            .expiredLeases(leases.stream().filter(l -> l.getStatus() == LeaseStatus.EXPIRED).count())
            .leasesExpiringSoon(leases.stream()
                .filter(l -> l.getStatus() == LeaseStatus.ACTIVE
                    && l.getEndDate() != null
                    && !l.getEndDate().isBefore(today)
                    && !l.getEndDate().isAfter(in30Days))
                .count())
            .totalInspections(inspections.size())
            .initialInspections(inspections.stream()
                .filter(i -> i.getInspectionType() == InspectionType.INITIAL).count())
            .finalInspections(inspections.stream()
                .filter(i -> i.getInspectionType() == InspectionType.FINAL).count())
            .completedInspections(inspections.stream()
                .filter(i -> i.getStatus() == LeaseInspectionStatus.COMPLETED).count())
            .pendingInspections(inspections.stream()
                .filter(i -> i.getStatus() == LeaseInspectionStatus.PENDING).count())
            .disputedInspections(inspections.stream()
                .filter(i -> i.getStatus() == LeaseInspectionStatus.DISPUTED).count())
            .build();
    }

    public List<Organization> getOrganizationsByManager(String managerAccountId) {
        if (managerAccountId == null || managerAccountId.isBlank()) {
            log.warn("Tentative de recherche par manager avec un ID null/vide");
            throw new IllegalArgumentException("L'ID du manager ne peut pas être null ou vide");
        }
        log.debug("Recherche des organizations du manager: {}", managerAccountId);
        return organizationRepository.findByManagerAccountId(managerAccountId);
    }
}
