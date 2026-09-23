package tn.esprit.pidev.repositories.financial;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.financial.FinancialInsight;

import java.util.List;

@Repository
public interface IFinancialInsightRepo extends MongoRepository<FinancialInsight, String> {
    List<FinancialInsight> findTop10ByOrganizationIdOrderByGeneratedAtDesc(String organizationId);
}
