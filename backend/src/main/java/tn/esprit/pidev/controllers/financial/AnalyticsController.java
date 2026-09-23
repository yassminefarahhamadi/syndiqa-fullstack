package tn.esprit.pidev.controllers.financial;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.dto.financial.ai.DashboardSummaryDTO;
import tn.esprit.pidev.dto.financial.ai.MonthlyTrendDTO;
import tn.esprit.pidev.dto.financial.ai.PaymentRiskDTO;
import tn.esprit.pidev.entities.financial.Charge;
import tn.esprit.pidev.entities.financial.ChargeStatus;
import tn.esprit.pidev.entities.financial.Payment;
import tn.esprit.pidev.entities.financial.RiskLevel;
import tn.esprit.pidev.entities.user.AccountRole;
import tn.esprit.pidev.entities.user.ResidentProfile;
import tn.esprit.pidev.repositories.financial.IChargeRepo;
import tn.esprit.pidev.repositories.financial.IPaymentRepo;
import tn.esprit.pidev.repositories.user.ResidentProfileRepository;
import tn.esprit.pidev.security.Roles;
import tn.esprit.pidev.services.financial.ai.PaymentRiskScorer;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final PaymentRiskScorer paymentRiskScorer;
    private final ResidentProfileRepository residentProfileRepository;
    private final IChargeRepo chargeRepository;
    private final IPaymentRepo paymentRepository;

    @GetMapping("/risk/{userId}")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<?> getRiskForUser(@PathVariable String userId, HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        
        Optional<ResidentProfile> resident = residentProfileRepository.findByAccountId(userId);
        if (resident.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        
        PaymentRiskDTO risk = paymentRiskScorer.calculateRiskScore(userId, orgId);
        return ResponseEntity.ok(risk);
    }

    @GetMapping("/risk/all")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<List<PaymentRiskDTO>> getAllRisks(HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        
        List<Charge> allCharges = chargeRepository.findByOrganizationId(orgId);
        List<Payment> allPayments = paymentRepository.findByOrganizationId(orgId);
        Map<String, List<Charge>> chargesByUser = allCharges.stream().filter(c -> c.getUserId() != null).collect(Collectors.groupingBy(Charge::getUserId));
        Map<String, List<Payment>> paymentsByUser = allPayments.stream().filter(p -> p.getUserId() != null).collect(Collectors.groupingBy(Payment::getUserId));

        List<ResidentProfile> residents = residentProfileRepository.findByOrganizationId(orgId);
        List<PaymentRiskDTO> risks = residents.stream()
                .map(r -> paymentRiskScorer.calculateRiskScoreBulk(r.getAccountId(), chargesByUser.getOrDefault(r.getAccountId(), new ArrayList<>()), paymentsByUser.getOrDefault(r.getAccountId(), new ArrayList<>())))
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(risks);
    }

    @GetMapping("/risk/high")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<List<PaymentRiskDTO>> getHighRisks(HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");
        
        List<Charge> allCharges = chargeRepository.findByOrganizationId(orgId);
        List<Payment> allPayments = paymentRepository.findByOrganizationId(orgId);
        Map<String, List<Charge>> chargesByUser = allCharges.stream().filter(c -> c.getUserId() != null).collect(Collectors.groupingBy(Charge::getUserId));
        Map<String, List<Payment>> paymentsByUser = allPayments.stream().filter(p -> p.getUserId() != null).collect(Collectors.groupingBy(Payment::getUserId));

        List<ResidentProfile> residents = residentProfileRepository.findByOrganizationId(orgId);
        List<PaymentRiskDTO> highRisks = residents.stream()
                .map(r -> paymentRiskScorer.calculateRiskScoreBulk(r.getAccountId(), chargesByUser.getOrDefault(r.getAccountId(), new ArrayList<>()), paymentsByUser.getOrDefault(r.getAccountId(), new ArrayList<>())))
                .filter(risk -> RiskLevel.HIGH.equals(risk.getRiskLevel()))
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(highRisks);
    }

    @GetMapping("/dashboard")
    @Roles({AccountRole.PLATFORM_ADMIN, AccountRole.SYNDIC_ADMIN})
    public ResponseEntity<DashboardSummaryDTO> getDashboardData(
            @RequestParam(required = false) String buildingId,
            HttpServletRequest request) {
        String orgId = (String) request.getAttribute("organizationId");

        List<Charge> charges;
        List<Payment> payments;

        if (buildingId != null && !buildingId.isEmpty()) {
            charges = chargeRepository.findByOrganizationIdAndBuildingId(orgId, buildingId);
            List<String> chargeIds = charges.stream().map(Charge::getId).collect(Collectors.toList());
            if (chargeIds.isEmpty()) {
                payments = new ArrayList<>();
            } else {
                payments = paymentRepository.findByChargeIdIn(chargeIds);
            }
        } else {
            charges = chargeRepository.findByOrganizationId(orgId);
            payments = paymentRepository.findByOrganizationId(orgId);
        }

        double totalCharged = 0.0;
        double totalCollected = 0.0;
        long overdueCount = 0;
        double overdueAmount = 0.0;

        for (Charge charge : charges) {
            if (charge.getAmount() != null) {
                totalCharged += charge.getAmount();
            }
            if (ChargeStatus.OVERDUE.equals(charge.getStatus())) {
                overdueCount++;
                double unpaid = (charge.getAmount() != null ? charge.getAmount() : 0) -
                        (charge.getPaidAmount() != null ? charge.getPaidAmount() : 0);
                overdueAmount += unpaid;
            }
        }

        for (Payment payment : payments) {
            if (payment.getAmount() != null) {
                totalCollected += payment.getAmount();
            }
        }

        double collectionRate = totalCharged > 0 ? (totalCollected / totalCharged) * 100.0 : 0.0;
        collectionRate = Math.round(collectionRate * 10.0) / 10.0;

        // Bulk process risk values
        Map<String, List<Charge>> chargesByUser = charges.stream().filter(c -> c.getUserId() != null).collect(Collectors.groupingBy(Charge::getUserId));
        Map<String, List<Payment>> paymentsByUser = payments.stream().filter(p -> p.getUserId() != null).collect(Collectors.groupingBy(Payment::getUserId));

        List<ResidentProfile> residents = residentProfileRepository.findByOrganizationId(orgId).stream()
            .filter(r -> chargesByUser.containsKey(r.getAccountId()))
            .collect(Collectors.toList());
            
        long highRiskCount = 0;
        long mediumRiskCount = 0;
        long lowRiskCount = 0;

        for (ResidentProfile resident : residents) {
            PaymentRiskDTO riskDTO = paymentRiskScorer.calculateRiskScoreBulk(resident.getAccountId(), chargesByUser.getOrDefault(resident.getAccountId(), new ArrayList<>()), paymentsByUser.getOrDefault(resident.getAccountId(), new ArrayList<>()));
            if (RiskLevel.HIGH.equals(riskDTO.getRiskLevel())) highRiskCount++;
            else if (RiskLevel.MEDIUM.equals(riskDTO.getRiskLevel())) mediumRiskCount++;
            else lowRiskCount++;
        }
        
        // Group payments by month for past 6 months
        Map<String, Double> monthlyMap = new TreeMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        for (Payment p : payments) {
            if (p.getPaymentDate() != null) {
                String monthLabel = p.getPaymentDate().format(formatter);
                monthlyMap.put(monthLabel, monthlyMap.getOrDefault(monthLabel, 0.0) + p.getAmount());
            }
        }
        
        List<MonthlyTrendDTO> trends = monthlyMap.entrySet().stream()
            .map(e -> new MonthlyTrendDTO(e.getKey(), e.getValue()))
            .collect(Collectors.toList());

        DashboardSummaryDTO summary = DashboardSummaryDTO.builder()
                .highRiskCount(highRiskCount)
                .mediumRiskCount(mediumRiskCount)
                .lowRiskCount(lowRiskCount)
                .totalCharged(totalCharged)
                .totalCollected(totalCollected)
                .collectionRate(collectionRate)
                .overdueCount(overdueCount)
                .overdueAmount(overdueAmount)
                .monthlyTrends(trends)
                .build();

        return ResponseEntity.ok(summary);
    }
}
