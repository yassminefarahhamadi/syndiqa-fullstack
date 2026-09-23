package tn.esprit.pidev.services.property;

import tn.esprit.pidev.entities.property.Apartment;

import java.util.List;

public interface ApartmentService {
    Apartment createApartment(Apartment apartment);
    Apartment getApartmentById(String id);
    List<Apartment> getApartmentsByBuilding(String buildingId);
    List<Apartment> getApartmentsByOrganization(String organizationId);
    List<Apartment> getAllApartments();
    Apartment updateApartment(String id, Apartment apartment);
    void deleteApartment(String id);
}
