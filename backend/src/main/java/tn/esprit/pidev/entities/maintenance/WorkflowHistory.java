package tn.esprit.pidev.entities.maintenance;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "workflow_history")
public class WorkflowHistory {

    @Id
    private String id;

    private String taskId;
    private TaskStatus previousStatus;
    private TaskStatus newStatus;
    private String updatedBy;
    private LocalDateTime timestamp;
    private String comments;
}

