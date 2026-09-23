package tn.esprit.pidev.services.organization;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.organization.ActivityType;
import tn.esprit.pidev.entities.organization.InspectionType;
import tn.esprit.pidev.entities.organization.Lease;
import tn.esprit.pidev.entities.organization.LeaseInspectionStatus;
import tn.esprit.pidev.entities.organization.LeaseStatus;
import tn.esprit.pidev.repositories.organization.LeaseInspectionRepository;
import tn.esprit.pidev.repositories.organization.LeaseRepository;

import tn.esprit.pidev.entities.organization.Organization;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaseService {

    private final LeaseRepository leaseRepository;
    private final LeaseInspectionRepository leaseInspectionRepository;
    private final OrganizationService organizationService;
    private final OrganizationActivityService activityService;

    // ─── CRUD ───────────────────────────────────────────────────────────────────

    public Lease createLease(Lease lease) {
        // Vérifier qu'il n'y a pas déjà un bail actif pour ce compte/appartement
        boolean alreadyActive = leaseRepository.existsByAccountIdAndApartmentIdAndStatus(
            lease.getAccountId(), lease.getApartmentId(), LeaseStatus.ACTIVE
        );
        if (alreadyActive) {
            throw new IllegalStateException(
                "An active lease already exists for this account and apartment."
            );
        }

        // Sauvegarder le bail
        Lease saved = leaseRepository.save(lease);

        activityService.log(saved.getOrganizationId(), ActivityType.LEASE_CREATED,
            "Bail créé pour le locataire " + saved.getAccountId(),
            saved.getAccountId(), saved.getId());

        // ✅ Ajouter automatiquement le locataire comme membre de l'organisation
        if (saved.getOrganizationId() != null && !saved.getOrganizationId().isBlank()
            && saved.getAccountId() != null && !saved.getAccountId().isBlank()) {
            try {
                organizationService.addMember(saved.getOrganizationId(), saved.getAccountId());
                log.info("Membre {} ajouté automatiquement à l'organisation {} via le bail {}",
                    saved.getAccountId(), saved.getOrganizationId(), saved.getId());
            } catch (Exception e) {
                // On ne bloque pas la création du bail si l'ajout du membre échoue
                log.warn("Impossible d'ajouter le membre {} à l'organisation {}: {}",
                    saved.getAccountId(), saved.getOrganizationId(), e.getMessage());
            }
        }

        return saved;
    }

    public List<Lease> getAllLeases() {
        return leaseRepository.findAll();
    }

    public List<Lease> getLeasesByOrganizationIds(List<String> orgIds) {
        if (orgIds == null || orgIds.isEmpty()) return new ArrayList<>();
        return leaseRepository.findByOrganizationIdIn(orgIds);
    }

    public Lease getLeaseById(String id) {
        return leaseRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Lease not found with id: " + id));
    }

    public Lease updateLease(String id, Lease updated) {
        Lease existing = getLeaseById(id);

        // ✅ Si l'organisation ou le locataire change, mettre à jour les membres
        String oldAccountId = existing.getAccountId();
        String oldOrgId     = existing.getOrganizationId();

        existing.setAccountId(updated.getAccountId());
        existing.setApartmentId(updated.getApartmentId());
        existing.setBuildingId(updated.getBuildingId());
        existing.setOrganizationId(updated.getOrganizationId());
        existing.setStartDate(updated.getStartDate());
        existing.setEndDate(updated.getEndDate());
        existing.setMonthlyRent(updated.getMonthlyRent());
        existing.setDepositAmount(updated.getDepositAmount());
        existing.setOwner(updated.isOwner());
        existing.setContractFileUrl(updated.getContractFileUrl());

        Lease saved = leaseRepository.save(existing);

        // Si l'organisation a changé : retirer de l'ancienne, ajouter à la nouvelle
        boolean orgChanged     = !oldOrgId.equals(saved.getOrganizationId());
        boolean accountChanged = !oldAccountId.equals(saved.getAccountId());

        if (orgChanged || accountChanged) {
            try {
                // Retirer l'ancien compte de l'ancienne organisation
                organizationService.removeMember(oldOrgId, oldAccountId);
                log.info("Membre {} retiré de l'organisation {} suite à modification du bail",
                    oldAccountId, oldOrgId);
            } catch (Exception e) {
                log.warn("Impossible de retirer le membre {} de l'organisation {}: {}",
                    oldAccountId, oldOrgId, e.getMessage());
            }

            try {
                // Ajouter le nouveau compte à la nouvelle organisation
                organizationService.addMember(saved.getOrganizationId(), saved.getAccountId());
                log.info("Membre {} ajouté à l'organisation {} suite à modification du bail",
                    saved.getAccountId(), saved.getOrganizationId());
            } catch (Exception e) {
                log.warn("Impossible d'ajouter le membre {} à l'organisation {}: {}",
                    saved.getAccountId(), saved.getOrganizationId(), e.getMessage());
            }
        }

        return saved;
    }

    public void deleteLease(String id) {
        Lease lease = getLeaseById(id);

        // ✅ Retirer le locataire des membres de l'organisation si plus aucun bail actif
        if (lease.getOrganizationId() != null && lease.getAccountId() != null) {
            long otherLeases = leaseRepository
                .findByAccountId(lease.getAccountId())
                .stream()
                .filter(l -> !l.getId().equals(id)
                    && l.getOrganizationId().equals(lease.getOrganizationId()))
                .count();

            if (otherLeases == 0) {
                try {
                    organizationService.removeMember(lease.getOrganizationId(), lease.getAccountId());
                    log.info("Membre {} retiré de l'organisation {} suite à suppression du bail",
                        lease.getAccountId(), lease.getOrganizationId());
                } catch (Exception e) {
                    log.warn("Impossible de retirer le membre {} de l'organisation {}: {}",
                        lease.getAccountId(), lease.getOrganizationId(), e.getMessage());
                }
            }
        }

        leaseRepository.deleteById(id);
    }

    // ─── Status management ──────────────────────────────────────────────────────

    public Lease activateLease(String id) {
        Lease lease = getLeaseById(id);
        if (lease.getStatus() != LeaseStatus.PENDING) {
            throw new IllegalStateException("Seuls les baux en attente (PENDING) peuvent être activés.");
        }
        // Règle métier #1 : un état des lieux INITIAL complété est obligatoire avant activation
        boolean hasCompletedInitial = leaseInspectionRepository
            .existsByLeaseIdAndInspectionTypeAndStatus(id, InspectionType.INITIAL, LeaseInspectionStatus.COMPLETED);
        if (!hasCompletedInitial) {
            throw new IllegalStateException(
                "Impossible d'activer ce bail : un état des lieux INITIAL avec statut COMPLETED est requis avant l'entrée du locataire."
            );
        }
        lease.setStatus(LeaseStatus.ACTIVE);
        log.info("Bail {} activé après vérification de l'inspection initiale.", id);
        Lease activated = leaseRepository.save(lease);
        activityService.log(activated.getOrganizationId(), ActivityType.LEASE_ACTIVATED,
            "Bail activé après inspection initiale complétée",
            activated.getAccountId(), id);
        return activated;
    }

    public Lease terminateLease(String id) {
        Lease lease = getLeaseById(id);
        // Seuls les baux ACTIVE peuvent être résiliés
        if (lease.getStatus() != LeaseStatus.ACTIVE) {
            throw new IllegalStateException(
                "Seuls les baux actifs (ACTIVE) peuvent être résiliés. Statut actuel : " + lease.getStatus()
            );
        }
        // Règle métier #2 : un état des lieux FINAL complété est obligatoire avant résiliation
        boolean hasCompletedFinal = leaseInspectionRepository
            .existsByLeaseIdAndInspectionTypeAndStatus(id, InspectionType.FINAL, LeaseInspectionStatus.COMPLETED);
        if (!hasCompletedFinal) {
            throw new IllegalStateException(
                "Impossible de résilier ce bail : un état des lieux FINAL avec statut COMPLETED est requis avant la sortie du locataire."
            );
        }
        lease.setStatus(LeaseStatus.TERMINATED);
        log.info("Bail {} résilié après vérification de l'inspection finale.", id);
        Lease terminated = leaseRepository.save(lease);
        activityService.log(terminated.getOrganizationId(), ActivityType.LEASE_TERMINATED,
            "Bail résilié après inspection finale complétée",
            terminated.getAccountId(), id);
        // Retirer automatiquement le locataire de l'organisation après résiliation
        if (terminated.getOrganizationId() != null && terminated.getAccountId() != null) {
            long otherActiveLeases = leaseRepository
                .findByAccountId(terminated.getAccountId())
                .stream()
                .filter(l -> !l.getId().equals(id)
                    && l.getOrganizationId().equals(terminated.getOrganizationId())
                    && l.getStatus() == LeaseStatus.ACTIVE)
                .count();
            if (otherActiveLeases == 0) {
                try {
                    organizationService.removeMember(terminated.getOrganizationId(), terminated.getAccountId());
                    log.info("Membre {} retiré de l'organisation {} suite à résiliation du bail",
                        terminated.getAccountId(), terminated.getOrganizationId());
                } catch (Exception e) {
                    log.warn("Impossible de retirer le membre {} de l'organisation {}: {}",
                        terminated.getAccountId(), terminated.getOrganizationId(), e.getMessage());
                }
            }
        }
        return terminated;
    }

    // Règle métier #5 : expiration automatique quotidienne à minuit
    @Scheduled(cron = "0 0 0 * * *")
    public void autoExpireLeases() {
        List<Lease> toExpire = leaseRepository.findByStatusAndEndDateBefore(LeaseStatus.ACTIVE, LocalDate.now());
        if (toExpire.isEmpty()) {
            log.info("[AutoExpire] Aucun bail à expirer aujourd'hui.");
            return;
        }
        toExpire.forEach(lease -> lease.setStatus(LeaseStatus.EXPIRED));
        leaseRepository.saveAll(toExpire);
        toExpire.forEach(lease -> activityService.log(lease.getOrganizationId(), ActivityType.LEASE_EXPIRED,
            "Bail expiré automatiquement (date de fin dépassée)", null, lease.getId()));
        log.info("[AutoExpire] {} bail(s) expiré(s) automatiquement le {}.", toExpire.size(), LocalDate.now());
    }

    public Lease expireLease(String id) {
        Lease lease = getLeaseById(id);
        lease.setStatus(LeaseStatus.EXPIRED);
        return leaseRepository.save(lease);
    }

    public List<Lease> getLeasesByStatus(LeaseStatus status) {
        return leaseRepository.findByStatus(status);
    }

    // ─── Queries by scope ───────────────────────────────────────────────────────

    public List<Lease> getLeasesByAccount(String accountId) {
        return leaseRepository.findByAccountId(accountId);
    }

    public List<Lease> getLeasesByAccountAndStatus(String accountId, LeaseStatus status) {
        return leaseRepository.findByAccountIdAndStatus(accountId, status);
    }

    public List<Lease> getLeasesByApartment(String apartmentId) {
        return leaseRepository.findByApartmentId(apartmentId);
    }

    public List<Lease> getLeasesByBuilding(String buildingId) {
        return leaseRepository.findByBuildingId(buildingId);
    }

    public List<Lease> getLeasesByBuildingAndStatus(String buildingId, LeaseStatus status) {
        return leaseRepository.findByBuildingIdAndStatus(buildingId, status);
    }

    public List<Lease> getLeasesByOrganization(String organizationId) {
        List<Lease> byOrg = leaseRepository.findByOrganizationId(organizationId);
        Set<String> found = byOrg.stream().map(Lease::getId).collect(Collectors.toSet());
        List<Lease> result = new ArrayList<>(byOrg);
        try {
            Organization org = organizationService.getOrganizationById(organizationId);
            List<String> memberIds = org.getMemberAccountIds();
            if (memberIds != null && !memberIds.isEmpty()) {
                leaseRepository.findByAccountIdIn(memberIds).stream()
                    .filter(l -> !found.contains(l.getId()))
                    .forEach(result::add);
            }
        } catch (Exception e) {
            log.warn("Fallback par membres impossible pour org {}: {}", organizationId, e.getMessage());
        }
        return result;
    }

    public List<Lease> getLeasesByOrganizationAndStatus(String organizationId, LeaseStatus status) {
        return leaseRepository.findByOrganizationIdAndStatus(organizationId, status);
    }

    // ─── Ownership & expiry ─────────────────────────────────────────────────────

    public List<Lease> getOwnerLeases() {
        return leaseRepository.findByIsOwner(true);
    }

    public List<Lease> getTenantLeases() {
        return leaseRepository.findByIsOwner(false);
    }

    public List<Lease> getExpiredLeases() {
        return leaseRepository.findByEndDateBefore(LocalDate.now());
    }

    public List<Lease> getLeasesExpiringBetween(LocalDate from, LocalDate to) {
        return leaseRepository.findByEndDateBetween(from, to);
    }

    public List<Lease> getLeasesExpiringSoon(int withinDays) {
        LocalDate today = LocalDate.now();
        return leaseRepository.findByEndDateBetween(today, today.plusDays(withinDays));
    }
}
