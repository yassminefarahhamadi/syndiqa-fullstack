package tn.esprit.pidev.services.financial;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.financial.SyndicDashboardDTO;
import tn.esprit.pidev.entities.financial.*;
import tn.esprit.pidev.entities.user.*;
import tn.esprit.pidev.entities.organization.*;
import tn.esprit.pidev.repositories.financial.*;
import tn.esprit.pidev.repositories.user.*;
import tn.esprit.pidev.repositories.organization.OrganizationRepository;
import tn.esprit.pidev.repositories.organization.LeaseRepository;
import tn.esprit.pidev.repositories.property.ResidenceRepository;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SyndicDashboardService {

    private final AccountRepository accountRepo;
    private final IApartmentRepo apartmentRepo;
    private final UserBuildingRepository buildingRepo;
    private final LeaseRepository leaseRepo;
    private final IChargeRepo chargeRepo;
    private final IPaymentRepo paymentRepo;
    private final IExpenseRepo expenseRepo;
    private final OrganizationRepository organizationRepo;
    private final ResidenceRepository residenceRepo;
    private final tn.esprit.pidev.services.financial.ai.PaymentRiskScorer paymentRiskScorer;

    public SyndicDashboardDTO getDashboard(String orgId) {
        // Accounts
        List<Account> orgAccounts = accountRepo.findByOrganizationId(orgId);
        long residents = orgAccounts.stream().filter(a -> AccountRole.RESIDENT.equals(a.getRole())).count();
        long staff = orgAccounts.stream().filter(a -> AccountRole.TECHNICAL_STAFF.equals(a.getRole())).count();

        // Apartments & Buildings
        List<Apartment> apartments = apartmentRepo.findByOrganizationId(orgId);
        List<tn.esprit.pidev.entities.user.Building> orgBuildings = buildingRepo.findByOrganizationId(orgId);
        long buildings = orgBuildings.size();

        // Organization Info
        String orgName = organizationRepo.findById(orgId).map(Organization::getName).orElse("Unknown Organization");
        List<String> resNames = residenceRepo.findByOrganizationId(orgId).stream()
                .map(tn.esprit.pidev.entities.property.Residence::getName)
                .collect(Collectors.toList());
        List<String> bldgNames = orgBuildings.stream()
                .map(tn.esprit.pidev.entities.user.Building::getName)
                .collect(Collectors.toList());

        // Leases
        List<Lease> activeLeases = leaseRepo.findByOrganizationIdAndStatus(orgId, LeaseStatus.ACTIVE);
        long owners = activeLeases.stream().filter(Lease::isOwner).count();
        long tenants = activeLeases.stream().filter(l -> !l.isOwner()).count();

        // Charges
        List<Charge> charges = chargeRepo.findByOrganizationId(orgId);
        double totalCharged = charges.stream().mapToDouble(c -> c.getAmount() != null ? c.getAmount() : 0).sum();
        double totalCollected = charges.stream().mapToDouble(c -> c.getPaidAmount() != null ? c.getPaidAmount() : 0).sum();
        double totalOverdue = charges.stream()
                .filter(c -> ChargeStatus.OVERDUE.equals(c.getStatus()))
                .mapToDouble(c -> (c.getAmount() != null ? c.getAmount() : 0) - (c.getPaidAmount() != null ? c.getPaidAmount() : 0))
                .sum();
        long overdueCount = charges.stream().filter(c -> ChargeStatus.OVERDUE.equals(c.getStatus())).count();
        long paidCount = charges.stream().filter(c -> ChargeStatus.PAID.equals(c.getStatus())).count();
        long pendingCount = charges.stream().filter(c -> ChargeStatus.PENDING.equals(c.getStatus())).count();
        long partialCount = charges.stream().filter(c -> ChargeStatus.PARTIALLY_PAID.equals(c.getStatus())).count();
        double collectionRate = totalCharged > 0 ? Math.round((totalCollected / totalCharged) * 1000.0) / 10.0 : 0;

        // Expenses
        List<Expense> expenses = expenseRepo.findByOrganizationId(orgId);
        double totalExpenses = expenses.stream().mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0).sum();

        // Recent overdue charges (top 10)
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        List<SyndicDashboardDTO.RecentChargeDTO> recentOverdue = charges.stream()
                .filter(c -> ChargeStatus.OVERDUE.equals(c.getStatus()))
                .sorted(Comparator.comparing(Charge::getDueDate).reversed())
                .limit(10)
                .map(c -> {
                    Account acc = orgAccounts.stream().filter(a -> a.getId().equals(c.getUserId())).findFirst().orElse(null);
                    Apartment apt = apartments.stream().filter(a -> a.getId() != null)
                            .filter(a -> activeLeases.stream().anyMatch(l -> l.getAccountId().equals(c.getUserId()) && l.getApartmentId().equals(a.getId())))
                            .findFirst().orElse(null);
                    return SyndicDashboardDTO.RecentChargeDTO.builder()
                            .residentName(acc != null ? acc.getFirstName() + " " + acc.getLastName() : "Unknown")
                            .apartmentNumber(apt != null ? apt.getApartmentNumber() : "-")
                            .label(c.getLabel())
                            .amount(c.getAmount() - (c.getPaidAmount() != null ? c.getPaidAmount() : 0))
                            .dueDate(c.getDueDate() != null ? c.getDueDate().format(fmt) : "-")
                            .status(c.getStatus().name())
                            .build();
                })
                .collect(Collectors.toList());

        // Monthly breakdown (last 6 months)
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM yyyy");
        List<SyndicDashboardDTO.MonthlyBreakdownDTO> monthly = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.now().minusMonths(i);
            String ymStr = ym.toString();
            String label = ym.atDay(1).format(monthFmt);

            double mCharged = charges.stream()
                    .filter(c -> ymStr.equals(c.getPeriod()))
                    .mapToDouble(c -> c.getAmount() != null ? c.getAmount() : 0).sum();
            double mCollected = charges.stream()
                    .filter(c -> ymStr.equals(c.getPeriod()))
                    .mapToDouble(c -> c.getPaidAmount() != null ? c.getPaidAmount() : 0).sum();
            double mExpenses = expenses.stream()
                    .filter(e -> e.getExpenseDate() != null && YearMonth.from(e.getExpenseDate()).equals(ym))
                    .mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0).sum();

            monthly.add(SyndicDashboardDTO.MonthlyBreakdownDTO.builder()
                    .month(label).charged(mCharged).collected(mCollected).expenses(mExpenses).build());
        }

        // Compute real risk counts using bulk scorer
        Map<String, List<Charge>> chargesByUser = charges.stream()
                .filter(c -> c.getUserId() != null)
                .collect(Collectors.groupingBy(Charge::getUserId));
        List<Payment> payments = paymentRepo.findByOrganizationId(orgId);
        Map<String, List<Payment>> paymentsByUser = payments.stream()
                .filter(p -> p.getUserId() != null)
                .collect(Collectors.groupingBy(Payment::getUserId));

        long highRiskCount = 0;
        long mediumRiskCount = 0;
        long lowRiskCount = 0;
        Set<String> scoredUsers = new HashSet<>();
        for (String uid : chargesByUser.keySet()) {
            if (scoredUsers.add(uid)) {
                var risk = paymentRiskScorer.calculateRiskScoreBulk(
                        uid,
                        chargesByUser.getOrDefault(uid, new ArrayList<>()),
                        paymentsByUser.getOrDefault(uid, new ArrayList<>()));
                if (tn.esprit.pidev.entities.financial.RiskLevel.HIGH.equals(risk.getRiskLevel())) highRiskCount++;
                else if (tn.esprit.pidev.entities.financial.RiskLevel.MEDIUM.equals(risk.getRiskLevel())) mediumRiskCount++;
                else lowRiskCount++;
            }
        }

        return SyndicDashboardDTO.builder()
                .organizationName(orgName)
                .residenceNames(resNames)
                .buildingNames(bldgNames)
                .totalBuildings((int) buildings)
                .totalApartments(apartments.size())
                .totalResidents((int) residents)
                .totalOwners((int) owners)
                .totalTenants((int) tenants)
                .totalStaff((int) staff)
                .activeLeases(activeLeases.size())
                .totalCharged(Math.round(totalCharged * 100.0) / 100.0)
                .totalCollected(Math.round(totalCollected * 100.0) / 100.0)
                .totalOverdue(Math.round(totalOverdue * 100.0) / 100.0)
                .collectionRate(collectionRate)
                .overdueChargesCount(overdueCount)
                .paidChargesCount(paidCount)
                .pendingChargesCount(pendingCount)
                .partialChargesCount(partialCount)
                .totalExpenses(Math.round(totalExpenses * 100.0) / 100.0)
                .highRiskCount(highRiskCount)
                .mediumRiskCount(mediumRiskCount)
                .lowRiskCount(lowRiskCount)
                .recentOverdueCharges(recentOverdue)
                .monthlyBreakdown(monthly)
                .build();
    }
}
