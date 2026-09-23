package tn.esprit.pidev.entities.IncidentAlert;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "execution_stats")
@Getter
@Setter
public class ExecutionStat {

    @Id
    private String id;

    private String methodName;
    private long duration;
    private boolean success;
    private LocalDateTime timestamp;

    public ExecutionStat() {}

    public ExecutionStat(String methodName, long duration, boolean success, LocalDateTime timestamp) {
        this.methodName = methodName;
        this.duration = duration;
        this.success = success;
        this.timestamp = timestamp;
    }


}
