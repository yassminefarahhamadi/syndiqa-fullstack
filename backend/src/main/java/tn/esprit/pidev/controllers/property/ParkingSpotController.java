package tn.esprit.pidev.controllers.property;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.property.ParkingSpot;
import tn.esprit.pidev.services.property.ParkingSpotService;

import java.util.List;

@RestController
@RequestMapping("/api/parking-spots")
@RequiredArgsConstructor
public class ParkingSpotController {

    private final ParkingSpotService parkingSpotService;
    
    @GetMapping
    public ResponseEntity<List<ParkingSpot>> getAllParkingSpots(jakarta.servlet.http.HttpServletRequest request) {
        String role = (String) request.getAttribute("role");
        String orgId = (String) request.getAttribute("organizationId");
        
        if ("SYNDIC_ADMIN".equals(role)) {
            return ResponseEntity.ok(parkingSpotService.getParkingSpotsByOrganization(orgId));
        }
        // No global getAll for leaf entities by default, but keeping it consistent
        return ResponseEntity.ok(List.of()); 
    }

    @GetMapping("/organization/{organizationId}")
    public ResponseEntity<List<ParkingSpot>> getParkingSpotsByOrganization(@PathVariable String organizationId) {
        return ResponseEntity.ok(parkingSpotService.getParkingSpotsByOrganization(organizationId));
    }

    /**
     * GET all parking spots by building ID
     * @param buildingId Building ID
     * @return List of parking spots in the building
     */
    @GetMapping("/building/{buildingId}")
    public ResponseEntity<List<ParkingSpot>> getParkingSpotsByBuilding(@PathVariable String buildingId) {
        try {
            List<ParkingSpot> parkingSpots = parkingSpotService.getParkingSpotsByBuilding(buildingId);
            return ResponseEntity.ok(parkingSpots);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    /**
     * GET parking spot by ID
     * @param id Parking spot ID
     * @return Parking spot object if found
     */
    @GetMapping("/{id}")
    public ResponseEntity<ParkingSpot> getParkingSpotById(@PathVariable String id) {
        try {
            ParkingSpot parkingSpot = parkingSpotService.getParkingSpotById(id);
            return ResponseEntity.ok(parkingSpot);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    /**
     * CREATE a new parking spot
     * @param parkingSpot Parking spot object to create
     * @return Created parking spot with HTTP 201 status
     */
    @PostMapping
    public ResponseEntity<ParkingSpot> createParkingSpot(@Valid @RequestBody ParkingSpot parkingSpot) {
        try {
            ParkingSpot createdParkingSpot = parkingSpotService.createParkingSpot(parkingSpot);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdParkingSpot);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    /**
     * UPDATE an existing parking spot
     * @param id Parking spot ID
     * @param parkingSpot Updated parking spot object
     * @return Updated parking spot object
     */
    @PutMapping("/{id}")
    public ResponseEntity<ParkingSpot> updateParkingSpot(@PathVariable String id, @Valid @RequestBody ParkingSpot parkingSpot) {
        try {
            ParkingSpot updatedParkingSpot = parkingSpotService.updateParkingSpot(id, parkingSpot);
            return ResponseEntity.ok(updatedParkingSpot);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    /**
     * DELETE a parking spot by ID
     * @param id Parking spot ID
     * @return HTTP 204 No Content on success
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteParkingSpot(@PathVariable String id) {
        try {
            parkingSpotService.deleteParkingSpot(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}

