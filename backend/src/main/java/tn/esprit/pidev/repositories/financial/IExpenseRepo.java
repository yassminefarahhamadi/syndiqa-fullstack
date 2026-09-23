package tn.esprit.pidev.repositories.financial;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidev.entities.financial.Expense;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface IExpenseRepo extends MongoRepository<Expense, String> {
    List<Expense> findByOrganizationId(String organizationId);
    List<Expense> findByOrganizationIdAndBuildingId(String organizationId, String buildingId);
    List<Expense> findByOrganizationIdAndCategory(String organizationId, String category);
    List<Expense> findByOrganizationIdAndCategoryAndExpenseDateAfter(String organizationId, String category, LocalDate date);
    Optional<Expense> findByIdAndOrganizationId(String id, String organizationId);
}
