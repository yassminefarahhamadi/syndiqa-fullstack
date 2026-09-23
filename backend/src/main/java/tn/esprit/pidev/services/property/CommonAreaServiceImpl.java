package tn.esprit.pidev.services.property;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.property.CommonArea;
import tn.esprit.pidev.repositories.property.CommonAreaRepository;
import tn.esprit.pidev.repositories.property.PropertyBuildingRepository;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class CommonAreaServiceImpl implements CommonAreaService {

    private final CommonAreaRepository commonAreaRepository;
    private final PropertyBuildingRepository buildingRepository;

    @Override
    public List<CommonArea> getCommonAreasByBuilding(String buildingId) {
        if (buildingId == null || buildingId.isBlank()) {
            throw new IllegalArgumentException("Building ID cannot be null or empty");
        }
        return commonAreaRepository.findByBuildingId(buildingId);
    }

    @Override
    public List<CommonArea> getCommonAreasByOrganization(String organizationId) {
        if (organizationId == null || organizationId.isBlank()) {
            throw new IllegalArgumentException("Organization ID cannot be null or empty");
        }
        return commonAreaRepository.findByOrganizationId(organizationId);
    }

    @Override
    public CommonArea getCommonAreaById(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Common area ID cannot be null or empty");
        }
        return commonAreaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Common area not found with id: " + id));
    }

    @Override
    public CommonArea createCommonArea(CommonArea commonArea) {
        if (commonArea == null) {
            throw new IllegalArgumentException("Common area cannot be null");
        }

        if (commonArea.getBuildingId() != null) {
            buildingRepository.findById(commonArea.getBuildingId()).ifPresent(b -> {
                commonArea.setOrganizationId(b.getOrganizationId());
            });
        }

        return commonAreaRepository.save(commonArea);
    }

    @Override
    public CommonArea updateCommonArea(String id, CommonArea commonArea) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Common area ID cannot be null or empty");
        }
        if (commonArea == null) {
            throw new IllegalArgumentException("Common area cannot be null");
        }

        CommonArea existing = getCommonAreaById(id);

        if (commonArea.getBuildingId() != null && !commonArea.getBuildingId().isBlank()) {
            existing.setBuildingId(commonArea.getBuildingId());
        }
        if (commonArea.getName() != null && !commonArea.getName().isBlank()) {
            existing.setName(commonArea.getName());
        }
        if (commonArea.getType() != null && !commonArea.getType().isBlank()) {
            existing.setType(commonArea.getType());
        }
        if (commonArea.getStatus() != null && !commonArea.getStatus().isBlank()) {
            existing.setStatus(commonArea.getStatus());
        }
        if (commonArea.getFloor() >= 0) {
            existing.setFloor(commonArea.getFloor());
        }
        if (commonArea.getSurfaceM2() >= 0) {
            existing.setSurfaceM2(commonArea.getSurfaceM2());
        }
        if (commonArea.getDescription() != null) {
            existing.setDescription(commonArea.getDescription());
        }

        return commonAreaRepository.save(existing);
    }

    @Override
    public void deleteCommonArea(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Common area ID cannot be null or empty");
        }
        if (!commonAreaRepository.existsById(id)) {
            throw new NoSuchElementException("Common area not found with id: " + id);
        }
        commonAreaRepository.deleteById(id);
    }
}

