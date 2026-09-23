package tn.esprit.pidev.services.property;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.property.BulkResidenceDTO;
import tn.esprit.pidev.entities.property.Building;
import tn.esprit.pidev.entities.property.Apartment;
import tn.esprit.pidev.entities.property.Residence;
import tn.esprit.pidev.repositories.property.ResidenceRepository;
import tn.esprit.pidev.repositories.property.PropertyBuildingRepository;
import tn.esprit.pidev.repositories.property.ApartmentRepository;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ResidenceServiceImpl implements ResidenceService {

    private final ResidenceRepository residenceRepository;
    private final PropertyBuildingRepository buildingRepository;
    private final ApartmentRepository apartmentRepository;

    @Override
    public Residence createFullResidence(BulkResidenceDTO dto) {
        // 1. Create Residence
        Residence residence = Residence.builder()
                .name(dto.getName())
                .address(dto.getAddress())
                .city(dto.getCity())
                .organizationId(dto.getOrganizationId())
                .build();

        Residence savedResidence = residenceRepository.save(residence);

        // 2. Create Buildings if any
        if (dto.getBuildings() != null) {
            for (BulkResidenceDTO.BuildingDTO bDto : dto.getBuildings()) {
                Building building = new Building();
                building.setResidenceId(savedResidence.getId());
                building.setName(bDto.getName());
                building.setFloorsCount(bDto.getFloorsCount());
                building.setParkingSpotsCount(bDto.getParkingSpotsCount());

                Building savedBuilding = buildingRepository.save(building);

                // 3. Create Apartments if any
                if (bDto.getApartments() != null) {
                    for (BulkResidenceDTO.ApartmentDTO aDto : bDto.getApartments()) {
                        Apartment apartment = new Apartment();
                        apartment.setBuildingId(savedBuilding.getId());
                        apartment.setFloor(aDto.getFloor());
                        apartment.setUnitNumber(aDto.getUnitNumber());
                        apartment.setSurfaceM2(aDto.getSurfaceM2());
                        apartment.setType(aDto.getType());
                        apartment.setStatus(aDto.getStatus());

                        apartmentRepository.save(apartment);
                    }
                }
            }
        }

        return savedResidence;
    }

    @Override
    public Residence createResidence(Residence residence) {
        if (residence == null) {
            throw new IllegalArgumentException("Residence cannot be null");
        }
        if (residence.getName() == null || residence.getName().isBlank()) {
            throw new IllegalArgumentException("Residence name cannot be null or empty");
        }
        return residenceRepository.save(residence);
    }

    @Override
    public Residence getResidenceById(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Residence ID cannot be null or empty");
        }
        return residenceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Residence not found with id: " + id));
    }

    @Override
    public List<Residence> getAllResidences() {
        return residenceRepository.findAll();
    }

    @Override
    public List<Residence> getResidencesByOrganization(String organizationId) {
        if (organizationId == null || organizationId.isBlank()) {
            throw new IllegalArgumentException("Organization ID cannot be null or empty");
        }
        return residenceRepository.findByOrganizationId(organizationId);
    }

    @Override
    public Residence updateResidence(String id, Residence residence) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Residence ID cannot be null or empty");
        }
        if (residence == null) {
            throw new IllegalArgumentException("Residence cannot be null");
        }

        Residence existingResidence = getResidenceById(id);

        if (residence.getName() != null && !residence.getName().isBlank()) {
            existingResidence.setName(residence.getName());
        }
        if (residence.getAddress() != null && !residence.getAddress().isBlank()) {
            existingResidence.setAddress(residence.getAddress());
        }
        if (residence.getCity() != null && !residence.getCity().isBlank()) {
            existingResidence.setCity(residence.getCity());
        }

        return residenceRepository.save(existingResidence);
    }

    @Override
    public void deleteResidence(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Residence ID cannot be null or empty");
        }
        if (!residenceRepository.existsById(id)) {
            throw new NoSuchElementException("Residence not found with id: " + id);
        }
        residenceRepository.deleteById(id);
    }
}

