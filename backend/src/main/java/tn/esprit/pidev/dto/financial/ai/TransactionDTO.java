package tn.esprit.pidev.dto.financial.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDTO {
    private LocalDate date;
    private String description;
    private Double amount;
    private String type; // DEBIT, CREDIT
    private String category; // SALARY, FOOD, TRANSPORT, UTILITIES, etc.
}