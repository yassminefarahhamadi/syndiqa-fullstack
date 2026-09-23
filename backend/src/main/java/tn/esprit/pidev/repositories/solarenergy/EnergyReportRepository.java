package tn.esprit.pidev.repositories.solarenergy;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.esprit.pidev.entities.solarenergy.EnergyReport;

import java.util.List;

public interface EnergyReportRepository extends MongoRepository<EnergyReport, String> {
    List<EnergyReport> findBySolarSystemId(String solarSystemId);
}
