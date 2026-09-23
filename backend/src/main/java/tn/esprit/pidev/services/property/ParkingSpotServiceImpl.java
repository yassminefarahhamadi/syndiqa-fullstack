package tn.esprit.pidev.services.property;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.property.ParkingSpot;
import tn.esprit.pidev.repositories.property.ParkingSpotRepository;
import tn.esprit.pidev.repositories.property.PropertyBuildingRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ParkingSpotServiceImpl implements ParkingSpotService {

    private final ParkingSpotRepository parkingSpotRepository;
    private final PropertyBuildingRepository buildingRepository;

    @Override
    public List<ParkingSpot> getParkingSpotsByBuilding(String buildingId) {
        return parkingSpotRepository.findByBuildingId(buildingId);
    }

    @Override
    public List<ParkingSpot> getParkingSpotsByOrganization(String organizationId) {
        return parkingSpotRepository.findByOrganizationId(organizationId);
    }

    @Override
    public ParkingSpot getParkingSpotById(String id) {
        return parkingSpotRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Parking spot not found with id: " + id));
    }

    @Override
    public ParkingSpot createParkingSpot(ParkingSpot parkingSpot) {
        if (parkingSpot.getBuildingId() != null) {
            buildingRepository.findById(parkingSpot.getBuildingId()).ifPresent(b -> {
                parkingSpot.setOrganizationId(b.getOrganizationId());
            });
        }
        return parkingSpotRepository.save(parkingSpot);
    }

    @Override
    public ParkingSpot updateParkingSpot(String id, ParkingSpot parkingSpot) {
        ParkingSpot existingSpot = getParkingSpotById(id);
        if (parkingSpot.getBuildingId() != null) {
            existingSpot.setBuildingId(parkingSpot.getBuildingId());
        }
        if (parkingSpot.getNumber() > 0) {
            existingSpot.setNumber(parkingSpot.getNumber());
        }
        if (parkingSpot.getType() != null) {
            existingSpot.setType(parkingSpot.getType());
        }
        if (parkingSpot.getStatus() != null) {
            existingSpot.setStatus(parkingSpot.getStatus());
        }
        return parkingSpotRepository.save(existingSpot);
    }

    @Override
    public void deleteParkingSpot(String id) {
        parkingSpotRepository.deleteById(id);
    }
}

