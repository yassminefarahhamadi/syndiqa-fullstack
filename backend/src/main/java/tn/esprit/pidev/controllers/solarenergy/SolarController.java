package tn.esprit.pidev.controllers.solarenergy;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.dto.solarenergy.SolarSystemResponseDTO;
import tn.esprit.pidev.entities.solarenergy.SolarSystem;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.services.solarenergy.SolarService;

import java.util.List;

@RestController
@RequestMapping("/solar")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class SolarController {

    private final SolarService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN, AccountRole.TECHNICAL_STAFF})
    public SolarSystem create(@RequestBody SolarSystem system) {
        return service.create(system);
    }

    @GetMapping
    public Page<SolarSystemResponseDTO> getAll(
            @PageableDefault(sort = "installationDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return service.getAll(pageable);
    }

    @GetMapping("/{id}")
    public SolarSystem getById(@PathVariable String id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN, AccountRole.TECHNICAL_STAFF})
    public SolarSystem update(
            @PathVariable String id,
            @RequestBody SolarSystem system
    ) {
        return service.update(id, system);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public void delete(@PathVariable String id) {
        service.delete(id);
    }
}
