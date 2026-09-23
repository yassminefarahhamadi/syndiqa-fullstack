package tn.esprit.pidev.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.pidev.entities.user.AccountRole;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteDto {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotNull(message = "Role is required")
    private AccountRole role;

    @NotBlank(message = "Organization ID is required")
    private String organizationId;

    private String buildingId;
}

