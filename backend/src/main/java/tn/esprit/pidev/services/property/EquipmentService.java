package tn.esprit.pidev.services.property;

import tn.esprit.pidev.entities.property.Equipment;

import java.util.List;

public interface EquipmentService {
    List<Equipment> getEquipmentByBuilding(String buildingId);
    List<Equipment> getEquipmentByOrganization(String organizationId);
    Equipment getEquipmentById(String id);
    Equipment createEquipment(Equipment equipment);
    Equipment updateEquipment(String id, Equipment equipment);
    void deleteEquipment(String id);
}

