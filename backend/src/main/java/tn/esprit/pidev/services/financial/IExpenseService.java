package tn.esprit.pidev.services.financial;

import tn.esprit.pidev.entities.financial.Expense;

import java.util.List;

public interface IExpenseService {
    Expense addExpense(String organizationId, Expense expense);
    Expense updateExpense(String organizationId, String id, Expense expense);
    void deleteExpense(String organizationId, String id);
    List<Expense> getAllExpenses(String organizationId);
    Expense getExpenseById(String organizationId, String id);
    List<Expense> getExpensesByBuilding(String organizationId, String buildingId);
}
