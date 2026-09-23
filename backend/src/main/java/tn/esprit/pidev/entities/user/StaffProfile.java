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
@Document(collection = "staff_profiles")
public class StaffProfile {

    @Id
    private String accountId;

    private String organizationId;
    private String jobTitle;
    private String department;

    @Builder.Default
    private List<String> assignedBuildingIds = new ArrayList<>();

    @Builder.Default
    private List<String> specializations = new ArrayList<>();

    private LocalDate hireDate;

    @Builder.Default
    private boolean isAvailable = true;
}

