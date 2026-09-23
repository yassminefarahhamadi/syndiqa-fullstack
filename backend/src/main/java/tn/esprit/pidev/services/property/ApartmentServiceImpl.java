package tn.esprit.pidev.services.property;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.property.Apartment;
import tn.esprit.pidev.repositories.property.ApartmentRepository;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ApartmentServiceImpl implements ApartmentService {

    private final ApartmentRepository apartmentRepository;
    private final tn.esprit.pidev.repositories.property.PropertyBuildingRepository buildingRepository;

    @Override
    public Apartment createApartment(Apartment apartment) {
        if (apartment == null) {
            throw new IllegalArgumentException("Apartment cannot be null");
        }
        
        // Set organizationId from building
        buildingRepository.findById(apartment.getBuildingId()).ifPresent(b -> {
            apartment.setOrganizationId(b.getOrganizationId());
        });

        return apartmentRepository.save(apartment);
    }

    @Override
    public Apartment getApartmentById(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Apartment ID cannot be null or empty");
        }
        return apartmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Apartment not found with id: " + id));
    }

    @Override
    public List<Apartment> getApartmentsByBuilding(String buildingId) {
        if (buildingId == null || buildingId.isBlank()) {
            throw new IllegalArgumentException("Building ID cannot be null or empty");
        }
        return apartmentRepository.findByBuildingId(buildingId);
    }

    @Override
    public List<Apartment> getAllApartments() {
        return apartmentRepository.findAll();
    }

    @Override
    public List<Apartment> getApartmentsByOrganization(String organizationId) {
        if (organizationId == null || organizationId.isBlank()) {
            throw new IllegalArgumentException("Organization ID cannot be null or empty");
        }
        return apartmentRepository.findByOrganizationId(organizationId);
    }

    @Override
    public Apartment updateApartment(String id, Apartment apartment) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Apartment ID cannot be null or empty");
        }
        if (apartment == null) {
            throw new IllegalArgumentException("Apartment cannot be null");
        }

        Apartment existingApartment = getApartmentById(id);

        if (apartment.getBuildingId() != null) {
            existingApartment.setBuildingId(apartment.getBuildingId());
        }
        if (apartment.getFloor() > 0) {
            existingApartment.setFloor(apartment.getFloor());
        }
        if (apartment.getUnitNumber() != null) {
            existingApartment.setUnitNumber(apartment.getUnitNumber());
        }
        if (apartment.getSurfaceM2() > 0) {
            existingApartment.setSurfaceM2(apartment.getSurfaceM2());
        }
        if (apartment.getType() != null) {
            existingApartment.setType(apartment.getType());
        }
        if (apartment.getStatus() != null) {
            existingApartment.setStatus(apartment.getStatus());
        }

        return apartmentRepository.save(existingApartment);
    }

    @Override
    public void deleteApartment(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Apartment ID cannot be null or empty");
        }
        if (!apartmentRepository.existsById(id)) {
            throw new NoSuchElementException("Apartment not found with id: " + id);
        }
        apartmentRepository.deleteById(id);
    }
}

