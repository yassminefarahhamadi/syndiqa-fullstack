package tn.esprit.pidev.entities.organization;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Data
@Document(collection = "residences")  // ← pointe sur la même collection MongoDB
public class Residence {
    @Id
    private String id;
    private String name;
    private String address;
    private String city;
}
