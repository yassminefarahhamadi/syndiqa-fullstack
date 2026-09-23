package tn.esprit.pidev.dto.IncidentAlert;



import lombok.Data;

@Data
public class AlertRequest {

    private String incidentId;

    private String message;

    private String targetRole; // RESIDENT / ADMIN

}

