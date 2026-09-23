package tn.esprit.pidev.controllers.financial;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.dto.financial.ai.DistributionConfirmResponseDTO;
import tn.esprit.pidev.dto.financial.ai.DistributionPreviewResponseDTO;
import tn.esprit.pidev.dto.financial.ai.DistributionRequestDTO;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.services.financial.ai.ChargeDistributor;

@RestController
@RequestMapping("/api/v1/charges/distribute")
@RequiredArgsConstructor
public class ChargeDistributorController {

    private final ChargeDistributor chargeDistributor;

    @PostMapping("/preview")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<DistributionPreviewResponseDTO> preview(
            @RequestBody DistributionRequestDTO requestDto,
            HttpServletRequest request) {

        String orgId = (String) request.getAttribute("organizationId");
        DistributionPreviewResponseDTO preview = chargeDistributor.previewDistribution(orgId, requestDto);
        return ResponseEntity.ok(preview);
    }

    @PostMapping("/confirm")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<DistributionConfirmResponseDTO> confirm(
            @RequestBody DistributionRequestDTO requestDto,
            HttpServletRequest request) {

        String orgId = (String) request.getAttribute("organizationId");
        DistributionConfirmResponseDTO response = chargeDistributor.confirmDistribution(orgId, requestDto);
        return ResponseEntity.ok(response);
    }
}
