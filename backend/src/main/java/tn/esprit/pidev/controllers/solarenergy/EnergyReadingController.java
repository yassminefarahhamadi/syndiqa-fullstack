package tn.esprit.pidev.controllers.solarenergy;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.entities.solarenergy.EnergyReading;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.dto.solarenergy.Esp32PotentiometerReading;
import tn.esprit.pidev.services.solarenergy.EnergyReadingService;

import java.util.List;

@RestController
@RequestMapping("/readings")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class EnergyReadingController {

    private final EnergyReadingService service;

    /**
     * POST /readings — IoT device or Admin simulation.
     * Timestamp is auto-generated server-side; client value is ignored.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN, AccountRole.TECHNICAL_STAFF})
    public EnergyReading create(@RequestBody EnergyReading reading) {
        return service.create(reading);
    }

    @PostMapping("/device")
    @ResponseStatus(HttpStatus.CREATED)
    public EnergyReading createFromDevice(@RequestBody Esp32PotentiometerReading dto) {
        return service.createFromDevice(dto);
    }

    /**
     * GET /readings/system/{solarId} — Fetch all readings for a solar system.
     */
    @GetMapping("/system/{solarId}")
    public List<EnergyReading> getBySolar(@PathVariable String solarId) {
        return service.getBySolarSystem(solarId);
    }

    @GetMapping
    public List<EnergyReading> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public EnergyReading getById(@PathVariable String id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN, AccountRole.TECHNICAL_STAFF})
    public EnergyReading update(
            @PathVariable String id,
            @RequestBody EnergyReading reading
    ) {
        return service.update(id, reading);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN, AccountRole.TECHNICAL_STAFF})
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}
