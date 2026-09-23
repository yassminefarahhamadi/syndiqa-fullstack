package tn.esprit.pidev.services.property;

import tn.esprit.pidev.entities.property.ParkingSpot;

import java.util.List;

public interface ParkingSpotService {
    List<ParkingSpot> getParkingSpotsByBuilding(String buildingId);
    List<ParkingSpot> getParkingSpotsByOrganization(String organizationId);
    ParkingSpot getParkingSpotById(String id);
    ParkingSpot createParkingSpot(ParkingSpot parkingSpot);
    ParkingSpot updateParkingSpot(String id, ParkingSpot parkingSpot);
    void deleteParkingSpot(String id);
}

