package tn.esprit.pidev.services.property;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.property.Equipment;
import tn.esprit.pidev.repositories.property.EquipmentRepository;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class EquipmentServiceImpl implements EquipmentService {

    private final EquipmentRepository equipmentRepository;

    @Override
    public List<Equipment> getEquipmentByBuilding(String buildingId) {
        if (buildingId == null || buildingId.isBlank()) {
            throw new IllegalArgumentException("Building ID cannot be null or empty");
        }
        return equipmentRepository.findByBuildingId(buildingId);
    }

    @Override
    public List<Equipment> getEquipmentByOrganization(String organizationId) {
        return List.of();
    }

    @Override
    public Equipment getEquipmentById(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Equipment ID cannot be null or empty");
        }
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Equipment not found with id: " + id));
    }

    @Override
    public Equipment createEquipment(Equipment equipment) {
        if (equipment == null) {
            throw new IllegalArgumentException("Equipment cannot be null");
        }
        return equipmentRepository.save(equipment);
    }

    @Override
    public Equipment updateEquipment(String id, Equipment equipment) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Equipment ID cannot be null or empty");
        }
        if (equipment == null) {
            throw new IllegalArgumentException("Equipment cannot be null");
        }

        Equipment existing = getEquipmentById(id);

        if (equipment.getBuildingId() != null && !equipment.getBuildingId().isBlank()) {
            existing.setBuildingId(equipment.getBuildingId());
        }
        if (equipment.getName() != null && !equipment.getName().isBlank()) {
            existing.setName(equipment.getName());
        }
        if (equipment.getType() != null && !equipment.getType().isBlank()) {
            existing.setType(equipment.getType());
        }
        if (equipment.getStatus() != null && !equipment.getStatus().isBlank()) {
            existing.setStatus(equipment.getStatus());
        }
        if (equipment.getSerialNumber() != null) {
            existing.setSerialNumber(equipment.getSerialNumber());
        }
        if (equipment.getManufacturer() != null) {
            existing.setManufacturer(equipment.getManufacturer());
        }
        if (equipment.getInstallDate() != null) {
            existing.setInstallDate(equipment.getInstallDate());
        }
        if (equipment.getLastInspectionDate() != null) {
            existing.setLastInspectionDate(equipment.getLastInspectionDate());
        }
        if (equipment.getNextMaintenanceDate() != null) {
            existing.setNextMaintenanceDate(equipment.getNextMaintenanceDate());
        }

        return equipmentRepository.save(existing);
    }

    @Override
    public void deleteEquipment(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Equipment ID cannot be null or empty");
        }
        if (!equipmentRepository.existsById(id)) {
            throw new NoSuchElementException("Equipment not found with id: " + id);
        }
        equipmentRepository.deleteById(id);
    }
}

