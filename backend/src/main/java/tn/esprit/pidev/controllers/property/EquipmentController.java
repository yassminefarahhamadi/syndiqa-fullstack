package tn.esprit.pidev.controllers.property;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.property.Equipment;
import tn.esprit.pidev.services.property.EquipmentService;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;
    
    @GetMapping
    public ResponseEntity<List<Equipment>> getAllEquipment(jakarta.servlet.http.HttpServletRequest request) {
        String role = (String) request.getAttribute("role");
        String orgId = (String) request.getAttribute("organizationId");
        
        if ("SYNDIC_ADMIN".equals(role)) {
            return ResponseEntity.ok(equipmentService.getEquipmentByOrganization(orgId));
        }
        return ResponseEntity.ok(List.of()); 
    }

    @GetMapping("/organization/{organizationId}")
    public ResponseEntity<List<Equipment>> getEquipmentByOrganization(@PathVariable String organizationId) {
        return ResponseEntity.ok(equipmentService.getEquipmentByOrganization(organizationId));
    }

    @GetMapping("/building/{buildingId}")
    public ResponseEntity<List<Equipment>> getEquipmentByBuilding(@PathVariable String buildingId) {
        try {
            List<Equipment> equipment = equipmentService.getEquipmentByBuilding(buildingId);
            return ResponseEntity.ok(equipment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Equipment> getEquipmentById(@PathVariable String id) {
        try {
            Equipment equipment = equipmentService.getEquipmentById(id);
            return ResponseEntity.ok(equipment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @PostMapping
    public ResponseEntity<Equipment> createEquipment(@Valid @RequestBody Equipment equipment) {
        try {
            Equipment createdEquipment = equipmentService.createEquipment(equipment);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdEquipment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Equipment> updateEquipment(@PathVariable String id,
                                                      @Valid @RequestBody Equipment equipment) {
        try {
            Equipment updatedEquipment = equipmentService.updateEquipment(id, equipment);
            return ResponseEntity.ok(updatedEquipment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEquipment(@PathVariable String id) {
        try {
            equipmentService.deleteEquipment(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}

