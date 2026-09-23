package tn.esprit.pidev.services.financial;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.pidev.entities.financial.Wallet;
import tn.esprit.pidev.exception.ForbiddenException;
import tn.esprit.pidev.exception.NotFoundException;
import tn.esprit.pidev.repositories.financial.IWalletRepo;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletServiceImpl implements IWalletService {

    private final IWalletRepo walletRepo;

    @Override
    public Wallet getWallet(String organizationId, String userId) {
        return walletRepo.findByUserIdAndOrganizationId(userId, organizationId)
                .orElseGet(() -> createWallet(organizationId, userId));
    }

    private Wallet createWallet(String organizationId, String userId) {
        Wallet newWallet = Wallet.builder()
                .userId(userId)
                .organizationId(organizationId)
                .balance(0.0)
                .build();
        return walletRepo.save(newWallet);
    }

    @Override
    @Transactional
    public Wallet addFunds(String organizationId, String userId, Double amount, String method) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");

        log.info("Adding {} TND to wallet for user {} in org {} via {}", amount, userId, organizationId, method);

        Wallet wallet = getWallet(organizationId, userId);
        
        double previousBalance = wallet.getBalance();
        wallet.setBalance(wallet.getBalance() + amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        
        Wallet.WalletTransaction tx = Wallet.WalletTransaction.builder()
                .id(UUID.randomUUID().toString())
                .type(Wallet.TransactionType.TOP_UP)
                .amount(amount)
                .balanceAfter(wallet.getBalance())
                .description("Top-up via " + method)
                .build();
        wallet.getTransactions().add(tx);
        
        log.info("Wallet for user {} topped up: {} TND -> {} TND (added {} TND)", 
                userId, previousBalance, wallet.getBalance(), amount);
        
        return walletRepo.save(wallet);
    }

    @Override
    @Transactional
    public Wallet deductFunds(String organizationId, String userId, Double amount, String chargeId) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");

        Wallet wallet = getWallet(organizationId, userId);
        
        if (wallet.getBalance() < amount) {
            throw new IllegalStateException("Insufficient wallet funds. Balance is " + wallet.getBalance());
        }

        wallet.setBalance(wallet.getBalance() - amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        
        Wallet.WalletTransaction tx = Wallet.WalletTransaction.builder()
                .id(UUID.randomUUID().toString())
                .type(Wallet.TransactionType.CHARGE_PAYMENT)
                .amount(-amount)
                .balanceAfter(wallet.getBalance())
                .description("Payment for Charge")
                .referenceId(chargeId)
                .build();
        wallet.getTransactions().add(tx);
        
        log.info("Wallet for user {} deducted by {} for charge {} (new balance: {})", userId, amount, chargeId, wallet.getBalance());
        return walletRepo.save(wallet);
    }
}
