package tn.esprit.pidev.services.solarenergy;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.solarenergy.SolarSystem;
import tn.esprit.pidev.repositories.solarenergy.SolarSystemRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import tn.esprit.pidev.entities.user.Building;
import tn.esprit.pidev.repositories.user.UserBuildingRepository;
import tn.esprit.pidev.security.JwtAuthenticationToken;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.entities.user.ResidentProfile;
import tn.esprit.pidev.repositories.user.ResidentProfileRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import tn.esprit.pidev.dto.solarenergy.SolarSystemResponseDTO;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SolarService {

    private final SolarSystemRepository solarRepo;
    private final UserBuildingRepository userBuildingRepository;
    private final ResidentProfileRepository residentProfileRepository;

    private void enforceOrganizationIsolation(String buildingId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            if (AccountRole.SYNDIC_ADMIN.name().equals(jwtAuth.getRole())) {
                String orgId = jwtAuth.getOrganizationId();
                Building building = userBuildingRepository.findById(buildingId)
                    .orElseThrow(() -> new IllegalArgumentException("Building not found"));
                if (orgId == null || !orgId.equals(building.getOrganizationId())) {
                    throw new AccessDeniedException("Access denied: Building does not belong to your organization");
                }
            } else if (AccountRole.RESIDENT.name().equals(jwtAuth.getRole())) {
                String accountId = jwtAuth.getAccountId();
                ResidentProfile profile = residentProfileRepository.findByAccountId(accountId)
                    .orElseThrow(() -> new AccessDeniedException("Resident profile not found"));
                if (profile.getBuildingId() == null || !profile.getBuildingId().equals(buildingId)) {
                    throw new AccessDeniedException("Access denied: You can only access the solar system of your own building");
                }
            }
        }
    }

    /** Business rule: one building can have only one SolarSystem */
    public SolarSystem create(SolarSystem system) {
        enforceOrganizationIsolation(system.getBuildingId());
        
        if (solarRepo.findByBuildingId(system.getBuildingId()).isPresent()) {
            throw new IllegalStateException(
                "Building '" + system.getBuildingId() + "' already has a solar system registered."
            );
        }
        return solarRepo.save(system);
    }

    private SolarSystemResponseDTO mapToDTO(SolarSystem system) {
        return SolarSystemResponseDTO.builder()
                .id(system.getId())
                .name(system.getName())
                .buildingId(system.getBuildingId())
                .capacityKw(system.getCapacityKw())
                .installationDate(system.getInstallationDate())
                .activeAnomaly(system.isActiveAnomaly())
                .build();
    }

    public Page<SolarSystemResponseDTO> getAll(Pageable pageable) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            if (AccountRole.SYNDIC_ADMIN.name().equals(jwtAuth.getRole())) {
                String orgId = jwtAuth.getOrganizationId();
                List<String> buildingIds = userBuildingRepository.findByOrganizationId(orgId)
                        .stream()
                        .map(Building::getId)
                        .collect(Collectors.toList());
                return solarRepo.findByBuildingIdIn(buildingIds, pageable).map(this::mapToDTO);
            } else if (AccountRole.RESIDENT.name().equals(jwtAuth.getRole())) {
                String accountId = jwtAuth.getAccountId();
                return residentProfileRepository.findByAccountId(accountId)
                        .flatMap(profile -> solarRepo.findByBuildingId(profile.getBuildingId()))
                        .map(sys -> (Page<SolarSystemResponseDTO>) new org.springframework.data.domain.PageImpl<>(
                                List.of(mapToDTO(sys)), pageable, 1))
                        .orElse(Page.empty(pageable));
            }
        }
        return solarRepo.findAll(pageable).map(this::mapToDTO);
    }

    public SolarSystem getById(String id) {
        SolarSystem system = solarRepo.findById(id).orElseThrow(() ->
            new NoSuchElementException("SolarSystem with id=" + id + " not found")
        );
        enforceOrganizationIsolation(system.getBuildingId());
        return system;
    }

    public SolarSystem update(String id, SolarSystem updated) {
        SolarSystem existing = getById(id);
        enforceOrganizationIsolation(updated.getBuildingId());
        
        // If buildingId changes, check no other system exists for that building
        if (!updated.getBuildingId().equals(existing.getBuildingId())) {
            if (solarRepo.findByBuildingId(updated.getBuildingId()).isPresent()) {
                throw new IllegalStateException(
                    "Building '" + updated.getBuildingId() + "' already has a solar system registered."
                );
            }
        }
        
        updated.setId(existing.getId());
        return solarRepo.save(updated);
    }

    public void delete(String id) {
        SolarSystem existing = getById(id);
        solarRepo.deleteById(existing.getId());
    }
}
