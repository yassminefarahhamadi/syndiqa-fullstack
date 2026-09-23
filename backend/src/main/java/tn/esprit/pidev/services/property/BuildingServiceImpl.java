package tn.esprit.pidev.services.property;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.property.Building;
import tn.esprit.pidev.repositories.property.PropertyBuildingRepository;
import tn.esprit.pidev.repositories.property.ResidenceRepository;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class BuildingServiceImpl implements BuildingService {

    private final PropertyBuildingRepository buildingRepository;
    private final ResidenceRepository residenceRepository;

    @Override
    public Building createBuilding(Building building) {
        if (building == null) {
            throw new IllegalArgumentException("Building cannot be null");
        }
        if (building.getName() == null || building.getName().isBlank()) {
            throw new IllegalArgumentException("Building name cannot be null or empty");
        }
        if (building.getResidenceId() == null || building.getResidenceId().isBlank()) {
            throw new IllegalArgumentException("Residence ID cannot be null or empty");
        }

        if (building.getFloorsCount() <= 0) {
            throw new IllegalArgumentException("Building must have at least 1 floor");
        }

        if (building.getParkingSpotsCount() <= 0) {
            throw new IllegalArgumentException("Building must have at least 1 parking spot");
        }

        // Set organizationId from residence
        residenceRepository.findById(building.getResidenceId()).ifPresent(res -> {
            building.setOrganizationId(res.getOrganizationId());
        });

        return buildingRepository.save(building);
    }

    @Override
    public Building getBuildingById(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Building ID cannot be null or empty");
        }
        return buildingRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Building not found with id: " + id));
    }

    @Override
    public List<Building> getBuildingsByResidence(String residenceId) {
        if (residenceId == null || residenceId.isBlank()) {
            throw new IllegalArgumentException("Residence ID cannot be null or empty");
        }
        return buildingRepository.findByResidenceId(residenceId);
    }

    @Override
    public List<Building> getAllBuildings() {
        return buildingRepository.findAll();
    }

    @Override
    public List<Building> getBuildingsByOrganization(String organizationId) {
        if (organizationId == null || organizationId.isBlank()) {
            throw new IllegalArgumentException("Organization ID cannot be null or empty");
        }
        return buildingRepository.findByOrganizationId(organizationId);
    }

    @Override
    public Building updateBuilding(String id, Building building) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Building ID cannot be null or empty");
        }
        if (building == null) {
            throw new IllegalArgumentException("Building cannot be null");
        }

        Building existingBuilding = getBuildingById(id);

        if (building.getResidenceId() != null && !building.getResidenceId().isBlank()) {
            existingBuilding.setResidenceId(building.getResidenceId());
        }
        if (building.getName() != null && !building.getName().isBlank()) {
            existingBuilding.setName(building.getName());
        }
        if (building.getFloorsCount() > 0) {
            existingBuilding.setFloorsCount(building.getFloorsCount());
        }
        if (building.getParkingSpotsCount() > 0) {
            existingBuilding.setParkingSpotsCount(building.getParkingSpotsCount());
        }

        return buildingRepository.save(existingBuilding);
    }

    @Override
    public void deleteBuilding(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Building ID cannot be null or empty");
        }
        if (!buildingRepository.existsById(id)) {
            throw new NoSuchElementException("Building not found with id: " + id);
        }
        buildingRepository.deleteById(id);
    }
}

