package tn.esprit.pidev.dto.IncidentAlert;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class WeeklyStat {

    private String week;
    private double avgDuration;

   /* public WeeklyStat(String week, double avgDuration) {
        this.week = week;
        this.avgDuration = avgDuration;
    }

    public String getWeek() { return week; }
    public double getAvgDuration() { return avgDuration; }*/
}
