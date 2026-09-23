package tn.esprit.pidev.services.property;

import tn.esprit.pidev.entities.property.Residence;

import tn.esprit.pidev.dto.property.BulkResidenceDTO;
import java.util.List;

public interface ResidenceService {
    Residence createResidence(Residence residence);
    Residence createFullResidence(BulkResidenceDTO bulkResidenceDTO);
    Residence getResidenceById(String id);
    List<Residence> getAllResidences();
    List<Residence> getResidencesByOrganization(String organizationId);
    Residence updateResidence(String id, Residence residence);
    void deleteResidence(String id);
}
