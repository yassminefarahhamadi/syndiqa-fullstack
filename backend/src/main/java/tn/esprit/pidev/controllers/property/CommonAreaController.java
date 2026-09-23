package tn.esprit.pidev.controllers.property;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.property.CommonArea;
import tn.esprit.pidev.services.property.CommonAreaService;

import java.util.List;

@RestController
@RequestMapping("/api/common-areas")
@RequiredArgsConstructor
public class CommonAreaController {

    private final CommonAreaService commonAreaService;
    
    @GetMapping
    public ResponseEntity<List<CommonArea>> getAllCommonAreas(jakarta.servlet.http.HttpServletRequest request) {
        String role = (String) request.getAttribute("role");
        String orgId = (String) request.getAttribute("organizationId");
        
        if ("SYNDIC_ADMIN".equals(role)) {
            return ResponseEntity.ok(commonAreaService.getCommonAreasByOrganization(orgId));
        }
        return ResponseEntity.ok(List.of()); 
    }

    @GetMapping("/organization/{organizationId}")
    public ResponseEntity<List<CommonArea>> getCommonAreasByOrganization(@PathVariable String organizationId) {
        return ResponseEntity.ok(commonAreaService.getCommonAreasByOrganization(organizationId));
    }

    @GetMapping("/building/{buildingId}")
    public ResponseEntity<List<CommonArea>> getCommonAreasByBuilding(@PathVariable String buildingId) {
        try {
            List<CommonArea> commonAreas = commonAreaService.getCommonAreasByBuilding(buildingId);
            return ResponseEntity.ok(commonAreas);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommonArea> getCommonAreaById(@PathVariable String id) {
        try {
            CommonArea commonArea = commonAreaService.getCommonAreaById(id);
            return ResponseEntity.ok(commonArea);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @PostMapping
    public ResponseEntity<CommonArea> createCommonArea(@Valid @RequestBody CommonArea commonArea) {
        try {
            CommonArea createdCommonArea = commonAreaService.createCommonArea(commonArea);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdCommonArea);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommonArea> updateCommonArea(@PathVariable String id,
                                                        @Valid @RequestBody CommonArea commonArea) {
        try {
            CommonArea updatedCommonArea = commonAreaService.updateCommonArea(id, commonArea);
            return ResponseEntity.ok(updatedCommonArea);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCommonArea(@PathVariable String id) {
        try {
            commonAreaService.deleteCommonArea(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}

