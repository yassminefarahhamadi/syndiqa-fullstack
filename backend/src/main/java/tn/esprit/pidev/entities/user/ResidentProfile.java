package tn.esprit.pidev.entities.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "resident_profiles")
public class ResidentProfile {

    @Id
    private String accountId;

    private String organizationId;
    private String nationalId;
    private LocalDate birthDate;

    // ── Property Scope (from Architecture Diagram) ──
    private String apartmentId;
    private String buildingId;
    private LocalDate moveInDate;
    private LocalDate moveOutDate;

    private EmergencyContact emergencyContact;

    @Builder.Default
    private List<NotifPref> notifPrefs = new ArrayList<>();

}
