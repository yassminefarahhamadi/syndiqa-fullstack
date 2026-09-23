package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.entities.communityevents.AccountStatus;
import tn.esprit.pidev.entities.user.*;
import tn.esprit.pidev.entities.organization.Lease;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private String id;
    private String organizationId;
    private String email;
    private AccountRole role;
    private AccountStatus status;
    private String firstName;
    private String lastName;
    private String phone;
    private String preferredLang;
    private String fcmToken;

    // Populated if role is RESIDENT_OWNER or RESIDENT_TENANT
    private ResidentProfile residentProfile;

    // Populated if role is TECHNICAL_STAFF
    private StaffProfile staffProfile;

    // Populated if role is RESIDENT_OWNER or RESIDENT_TENANT (active lease)
    private Lease activeLease;
}

