package tn.esprit.pidev.services.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.ProfileResponse;
import tn.esprit.pidev.dto.UpdateProfileDto;
import tn.esprit.pidev.entities.user.*;
import tn.esprit.pidev.exception.NotFoundException;
import tn.esprit.pidev.repositories.organization.LeaseRepository;
import tn.esprit.pidev.entities.organization.Lease;
import tn.esprit.pidev.entities.organization.LeaseStatus;

import tn.esprit.pidev.repositories.user.*;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final ResidentProfileRepository residentProfileRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final LeaseRepository leaseRepository;

    /**
     * Returns the full profile for GET /auth/me.
     * Includes ResidentProfile or StaffProfile based on role,
     * and active Lease for RESIDENT_OWNER/RESIDENT_TENANT.
     */
    public ProfileResponse getProfile(String accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        ProfileResponse.ProfileResponseBuilder builder = ProfileResponse.builder()
                .id(account.getId())
                .organizationId(account.getOrganizationId())
                .email(account.getEmail())
                .role(account.getRole())
                .status(account.getStatus())
                .firstName(account.getFirstName())
                .lastName(account.getLastName())
                .phone(account.getPhone())
                .preferredLang(account.getPreferredLang())
                .fcmToken(account.getFcmToken());

        // Attach role-specific profile
        if (account.getRole() == AccountRole.RESIDENT) {
            residentProfileRepository.findByAccountId(accountId).ifPresent(builder::residentProfile);

            // Attach active lease
            leaseRepository.findFirstByAccountIdAndStatus(accountId, LeaseStatus.ACTIVE)
                    .ifPresent(builder::activeLease);

        } else if (account.getRole() == AccountRole.TECHNICAL_STAFF) {
            staffProfileRepository.findByAccountId(accountId).ifPresent(builder::staffProfile);
        }

        return builder.build();
    }

    /**
     * Updates profile for PATCH /auth/me.
     * Routes account fields to Account, profile fields to respective collection.
     */
    public ProfileResponse updateProfile(String accountId, UpdateProfileDto dto) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new NotFoundException("Account not found"));

        // Update Account fields
        if (dto.getFirstName() != null) account.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) account.setLastName(dto.getLastName());
        if (dto.getPhone() != null) account.setPhone(dto.getPhone());
        if (dto.getPreferredLang() != null) account.setPreferredLang(dto.getPreferredLang());
        if (dto.getFcmToken() != null) account.setFcmToken(dto.getFcmToken());
        accountRepository.save(account);

        // Update ResidentProfile fields
        if (account.getRole() == AccountRole.RESIDENT) {
            ResidentProfile profile = residentProfileRepository.findByAccountId(accountId)
                    .orElseGet(() -> ResidentProfile.builder()
                            .accountId(accountId)
                            .organizationId(account.getOrganizationId())
                            .build());

            if (dto.getNationalId() != null) profile.setNationalId(dto.getNationalId());
            if (dto.getBirthDate() != null) profile.setBirthDate(dto.getBirthDate());
            if (dto.getEmergencyContact() != null) profile.setEmergencyContact(dto.getEmergencyContact());
            if (dto.getNotifPrefs() != null) profile.setNotifPrefs(dto.getNotifPrefs());
            residentProfileRepository.save(profile);
        }

        // Update StaffProfile fields
        if (account.getRole() == AccountRole.TECHNICAL_STAFF) {
            StaffProfile profile = staffProfileRepository.findByAccountId(accountId)
                    .orElseGet(() -> StaffProfile.builder()
                            .accountId(accountId)
                            .organizationId(account.getOrganizationId())
                            .build());

            if (dto.getJobTitle() != null) profile.setJobTitle(dto.getJobTitle());
            if (dto.getDepartment() != null) profile.setDepartment(dto.getDepartment());
            if (dto.getSpecializations() != null) profile.setSpecializations(dto.getSpecializations());
            staffProfileRepository.save(profile);
        }

        return getProfile(accountId);
    }

    /**
     * Public helper for other modules — returns the active lease for an account.
     */
    public Optional<Lease> getActiveLease(String accountId) {
        return leaseRepository.findFirstByAccountIdAndStatus(accountId, LeaseStatus.ACTIVE);
    }
}


