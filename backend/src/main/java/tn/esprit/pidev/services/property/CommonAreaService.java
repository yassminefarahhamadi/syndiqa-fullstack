package tn.esprit.pidev.services.property;

import tn.esprit.pidev.entities.property.CommonArea;

import java.util.List;

public interface CommonAreaService {
    List<CommonArea> getCommonAreasByBuilding(String buildingId);
    List<CommonArea> getCommonAreasByOrganization(String organizationId);
    CommonArea getCommonAreaById(String id);
    CommonArea createCommonArea(CommonArea commonArea);
    CommonArea updateCommonArea(String id, CommonArea commonArea);
    void deleteCommonArea(String id);
}

