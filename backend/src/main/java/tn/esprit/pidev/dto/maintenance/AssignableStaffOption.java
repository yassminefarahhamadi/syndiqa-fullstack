package tn.esprit.pidev.dto.maintenance;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignableStaffOption {
    private String accountId;
    private String fullName;
    private String jobTitle;
}
