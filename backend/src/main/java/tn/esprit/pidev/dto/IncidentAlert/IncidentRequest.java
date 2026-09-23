package tn.esprit.pidev.dto.IncidentAlert;


import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class IncidentRequest {

    private String type;

    private String category;

    private String description;

    private String buildingId;

    private String userSeverity;
    //  private List<MultipartFile> files; // 👈 images

}

