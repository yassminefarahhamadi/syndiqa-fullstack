package tn.esprit.pidev.events.solarenergy;

import org.springframework.context.ApplicationEvent;
import tn.esprit.pidev.entities.solarenergy.EnergyReading;

public class ReadingSavedEvent extends ApplicationEvent {
    
    private final EnergyReading reading;

    public ReadingSavedEvent(EnergyReading reading) {
        super(reading);
        this.reading = reading;
    }

    public EnergyReading getReading() {
        return reading;
    }
}
