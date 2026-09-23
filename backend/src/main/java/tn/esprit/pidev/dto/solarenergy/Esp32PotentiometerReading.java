package tn.esprit.pidev.dto.solarenergy;

import lombok.Data;

@Data
public class Esp32PotentiometerReading {
    private String solarSystemId;
    private int analogValue;
}
