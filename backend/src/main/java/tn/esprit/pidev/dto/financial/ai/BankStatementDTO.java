package tn.esprit.pidev.dto.financial.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankStatementDTO {
    private String accountNumber;
    private LocalDate statementDate;
    private Double balance;
    private List<TransactionDTO> transactions;
    private String bankName;
}