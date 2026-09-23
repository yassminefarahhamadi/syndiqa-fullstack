package tn.esprit.pidev.controllers.property;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.property.Apartment;
import tn.esprit.pidev.services.property.ApartmentService;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/apartments")
@RequiredArgsConstructor
public class ApartmentController {

    private final ApartmentService apartmentService;

    @GetMapping
    public ResponseEntity<List<Apartment>> getAllApartments(jakarta.servlet.http.HttpServletRequest request) {
        String role = (String) request.getAttribute("role");
        String orgId = (String) request.getAttribute("organizationId");
        
        if ("SYNDIC_ADMIN".equals(role)) {
            return ResponseEntity.ok(apartmentService.getApartmentsByOrganization(orgId));
        }
        return ResponseEntity.ok(apartmentService.getAllApartments());
    }

    @GetMapping("/organization/{organizationId}")
    public ResponseEntity<List<Apartment>> getApartmentsByOrganization(@PathVariable String organizationId) {
        return ResponseEntity.ok(apartmentService.getApartmentsByOrganization(organizationId));
    }

    /**
     * GET all apartments by building ID
     * @param buildingId Building ID
     * @return List of apartments in the building
     */
    @GetMapping("/building/{buildingId}")
    public ResponseEntity<List<Apartment>> getApartmentsByBuilding(@PathVariable String buildingId) {
        try {
            List<Apartment> apartments = apartmentService.getApartmentsByBuilding(buildingId);
            return ResponseEntity.ok(apartments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    /**
     * GET apartment by ID
     * @param id Apartment ID
     * @return Apartment object if found
     */
    @GetMapping("/{id}")
    public ResponseEntity<Apartment> getApartmentById(@PathVariable String id) {
        try {
            Apartment apartment = apartmentService.getApartmentById(id);
            return ResponseEntity.ok(apartment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    /**
     * CREATE a new apartment
     * @param apartment Apartment object to create
     * @return Created apartment with HTTP 201 status
     */
    @PostMapping
    public ResponseEntity<Apartment> createApartment(@Valid @RequestBody Apartment apartment) {
        try {
            Apartment createdApartment = apartmentService.createApartment(apartment);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdApartment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    /**
     * UPDATE an existing apartment
     * @param id Apartment ID
     * @param apartment Updated apartment object
     * @return Updated apartment object
     */
    @PutMapping("/{id}")
    public ResponseEntity<Apartment> updateApartment(@PathVariable String id, @Valid @RequestBody Apartment apartment) {
        try {
            Apartment updatedApartment = apartmentService.updateApartment(id, apartment);
            return ResponseEntity.ok(updatedApartment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    /**
     * DELETE an apartment by ID
     * @param id Apartment ID
     * @return HTTP 204 No Content on success
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApartment(@PathVariable String id) {
        try {
            apartmentService.deleteApartment(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}

