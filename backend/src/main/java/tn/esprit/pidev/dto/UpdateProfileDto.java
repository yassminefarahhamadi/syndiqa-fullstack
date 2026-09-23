package tn.esprit.pidev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.entities.user.EmergencyContact;
import tn.esprit.pidev.entities.user.NotifPref;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileDto {

    // Account fields
    private String firstName;
    private String lastName;
    private String phone;
    private String preferredLang;
    private String fcmToken;

    // ResidentProfile fields
    private String nationalId;
    private LocalDate birthDate;
    private EmergencyContact emergencyContact;
    private List<NotifPref> notifPrefs;

    // StaffProfile fields
    private String jobTitle;
    private String department;
    private List<String> specializations;
}

