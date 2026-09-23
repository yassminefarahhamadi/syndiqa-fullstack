package tn.esprit.pidev.controllers.property;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.property.Residence;
import tn.esprit.pidev.services.property.ResidenceService;

import tn.esprit.pidev.dto.property.BulkResidenceDTO;
import java.util.List;

@RestController
@RequestMapping("/api/residences")
@RequiredArgsConstructor
public class ResidenceController {

    private final ResidenceService residenceService;

    @PostMapping("/bulk")
    public ResponseEntity<Residence> createFullResidence(@RequestBody BulkResidenceDTO dto) {
        try {
            Residence createdResidence = residenceService.createFullResidence(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdResidence);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @GetMapping
    public ResponseEntity<List<Residence>> getAllResidences() {
        List<Residence> residences = residenceService.getAllResidences();
        return ResponseEntity.ok(residences);
    }
    
    @GetMapping("/organization/{organizationId}")
    public ResponseEntity<List<Residence>> getResidencesByOrganization(@PathVariable String organizationId) {
        List<Residence> residences = residenceService.getResidencesByOrganization(organizationId);
        return ResponseEntity.ok(residences);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Residence> getResidenceById(@PathVariable String id) {
        try {
            Residence residence = residenceService.getResidenceById(id);
            return ResponseEntity.ok(residence);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @PostMapping
    public ResponseEntity<Residence> createResidence(@Valid @RequestBody Residence residence) {
        try {
            Residence createdResidence = residenceService.createResidence(residence);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdResidence);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Residence> updateResidence(@PathVariable String id, @Valid @RequestBody Residence residence) {
        try {
            Residence updatedResidence = residenceService.updateResidence(id, residence);
            return ResponseEntity.ok(updatedResidence);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResidence(@PathVariable String id) {
        try {
            residenceService.deleteResidence(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}

