package tn.esprit.pidev.services.property;

import tn.esprit.pidev.entities.property.Building;

import java.util.List;

public interface BuildingService {
    Building createBuilding(Building building);
    Building getBuildingById(String id);
    List<Building> getBuildingsByResidence(String residenceId);
    List<Building> getBuildingsByOrganization(String organizationId);
    List<Building> getAllBuildings();
    Building updateBuilding(String id, Building building);
    void deleteBuilding(String id);
}
