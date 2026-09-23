package tn.esprit.pidev.dto.property;

import lombok.Data;
import java.util.List;

@Data
public class BulkResidenceDTO {
    // Residence fields
    private String name;
    private String address;
    private String city;
    private String organizationId;
    
    private List<BuildingDTO> buildings;

    @Data
    public static class BuildingDTO {
        // Building fields
        private String name;
        private int floorsCount;
        private int parkingSpotsCount;
        
        private List<ApartmentDTO> apartments;
    }

    @Data
    public static class ApartmentDTO {
        // Apartment fields
        private int floor;
        private String unitNumber;
        private double surfaceM2;
        private String type;
        private String status;
    }
}
