package tn.esprit.pidev.repositories.solarenergy;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import tn.esprit.pidev.entities.solarenergy.EnergyReading;

import java.time.LocalDateTime;
import java.util.List;

public interface EnergyReadingRepository extends MongoRepository<EnergyReading, String> {
    List<EnergyReading> findBySolarSystemId(String solarSystemId);

    @Query("{ 'solarSystemId': ?0, 'timestamp': { $gte: ?1 } }")
    List<EnergyReading> findBySolarSystemIdAndTimestampAfter(String solarSystemId, LocalDateTime since);

    @Query("{ 'solarSystemId': ?0, 'timestamp': { $gte: ?1, $lt: ?2 } }")
    List<EnergyReading> findBySolarSystemIdAndTimestampBetween(String solarSystemId, LocalDateTime from, LocalDateTime to);

    @Query("{ 'timestamp': { $gte: ?0, $lt: ?1 } }")
    List<EnergyReading> findByTimestampBetween(LocalDateTime from, LocalDateTime to);

    long countBySolarSystemId(String solarSystemId);
}
