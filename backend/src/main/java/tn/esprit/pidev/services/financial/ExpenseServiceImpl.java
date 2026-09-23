package tn.esprit.pidev.services.financial;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.financial.Expense;
import tn.esprit.pidev.exception.NotFoundException;
import tn.esprit.pidev.repositories.financial.IExpenseRepo;

import java.time.LocalDateTime;
import java.util.List;

import static tn.esprit.pidev.config.CacheConfig.EXPENSES_CACHE;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseServiceImpl implements IExpenseService {

    private final IExpenseRepo expenseRepo;

    @Override
    @CacheEvict(value = EXPENSES_CACHE, allEntries = true)
    public Expense addExpense(String organizationId, Expense expense) {
        expense.setOrganizationId(organizationId);
        expense.setCreatedAt(LocalDateTime.now());
        return expenseRepo.save(expense);
    }

    @Override
    @CacheEvict(value = EXPENSES_CACHE, allEntries = true)
    public Expense updateExpense(String organizationId, String id, Expense expense) {
        Expense existing = findByIdAndOrg(organizationId, id);
        if (expense.getDescription() != null) existing.setDescription(expense.getDescription());
        if (expense.getAmount() != null) existing.setAmount(expense.getAmount());
        if (expense.getCategory() != null) existing.setCategory(expense.getCategory());
        if (expense.getExpenseDate() != null) existing.setExpenseDate(expense.getExpenseDate());
        if (expense.getBuildingId() != null) existing.setBuildingId(expense.getBuildingId());
        return expenseRepo.save(existing);
    }

    @Override
    @CacheEvict(value = EXPENSES_CACHE, allEntries = true)
    public void deleteExpense(String organizationId, String id) {
        Expense existing = findByIdAndOrg(organizationId, id);
        expenseRepo.delete(existing);
    }

    @Override
    @Cacheable(value = EXPENSES_CACHE, key = "'org:' + #organizationId")
    public List<Expense> getAllExpenses(String organizationId) {
        return expenseRepo.findByOrganizationId(organizationId);
    }

    @Override
    @Cacheable(value = EXPENSES_CACHE, key = "'org:' + #organizationId + ':id:' + #id")
    public Expense getExpenseById(String organizationId, String id) {
        return findByIdAndOrg(organizationId, id);
    }

    @Override
    @Cacheable(value = EXPENSES_CACHE, key = "'org:' + #organizationId + ':building:' + #buildingId")
    public List<Expense> getExpensesByBuilding(String organizationId, String buildingId) {
        return expenseRepo.findByOrganizationIdAndBuildingId(organizationId, buildingId);
    }

    private Expense findByIdAndOrg(String organizationId, String id) {
        return expenseRepo.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new NotFoundException("Expense not found or access denied"));
    }
}
