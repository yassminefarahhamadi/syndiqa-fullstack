package tn.esprit.pidev.dto.IncidentAlert;

import lombok.AllArgsConstructor;
import lombok.Getter;
@AllArgsConstructor
@Getter
public class ExecutionStatsSummary {

    private double averageDuration;
    private long totalCalls;
    private double errorRate;

   /* public ExecutionStatsSummary(double avg, long total, double errorRate) {
        this.averageDuration = avg;
        this.totalCalls = total;
        this.errorRate = errorRate;
    }*/


}
