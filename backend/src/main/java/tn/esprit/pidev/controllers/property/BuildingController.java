package tn.esprit.pidev.controllers.property;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.property.Building;
import tn.esprit.pidev.services.property.BuildingService;

import java.util.List;

@RestController
@RequestMapping("/api/buildings")
@RequiredArgsConstructor
public class BuildingController {

    private final BuildingService buildingService;
    
    /**
     * GET all buildings
     * @return List of all buildings
     */
    @GetMapping
    public ResponseEntity<List<Building>> getAllBuildings(jakarta.servlet.http.HttpServletRequest request) {
        String role = (String) request.getAttribute("role");
        String orgId = (String) request.getAttribute("organizationId");
        
        if ("SYNDIC_ADMIN".equals(role)) {
            return ResponseEntity.ok(buildingService.getBuildingsByOrganization(orgId));
        }
        return ResponseEntity.ok(buildingService.getAllBuildings());
    }

    @GetMapping("/organization/{organizationId}")
    public ResponseEntity<List<Building>> getBuildingsByOrganization(@PathVariable String organizationId) {
        return ResponseEntity.ok(buildingService.getBuildingsByOrganization(organizationId));
    }

    @GetMapping("/residence/{residenceId}")
    public ResponseEntity<List<Building>> getBuildingsByResidence(@PathVariable String residenceId) {
        try {
            List<Building> buildings = buildingService.getBuildingsByResidence(residenceId);
            return ResponseEntity.ok(buildings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Building> getBuildingById(@PathVariable String id) {
        try {
            Building building = buildingService.getBuildingById(id);
            return ResponseEntity.ok(building);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @PostMapping
    public ResponseEntity<Building> createBuilding(@Valid @RequestBody Building building) {
        try {
            Building createdBuilding = buildingService.createBuilding(building);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdBuilding);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Building> updateBuilding(@PathVariable String id, @Valid @RequestBody Building building) {
        try {
            Building updatedBuilding = buildingService.updateBuilding(id, building);
            return ResponseEntity.ok(updatedBuilding);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBuilding(@PathVariable String id) {
        try {
            buildingService.deleteBuilding(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}

