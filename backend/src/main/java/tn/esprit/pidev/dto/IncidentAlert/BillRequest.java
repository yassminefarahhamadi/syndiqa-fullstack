package tn.esprit.pidev.dto.IncidentAlert;

import lombok.Data;

@Data
public class BillRequest {
    public String incidentId;
    public int hours;
    public double materialsCost;
}
