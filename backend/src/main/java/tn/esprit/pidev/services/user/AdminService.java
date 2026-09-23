package tn.esprit.pidev.services.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.communityevents.AccountStatus;
import tn.esprit.pidev.entities.user.*;
import tn.esprit.pidev.entities.organization.*;
import tn.esprit.pidev.exception.ConflictException;
import tn.esprit.pidev.exception.NotFoundException;
import tn.esprit.pidev.repositories.user.*;
import tn.esprit.pidev.repositories.financial.IChargeRepo;
import tn.esprit.pidev.repositories.financial.IExpenseRepo;
import tn.esprit.pidev.repositories.financial.IPaymentRepo;
import tn.esprit.pidev.repositories.maintenance.MaintenanceRequestRepository;
import tn.esprit.pidev.repositories.organization.OrganizationRepository;
import tn.esprit.pidev.repositories.organization.LeaseRepository;
import tn.esprit.pidev.repositories.property.ApartmentRepository;
import tn.esprit.pidev.repositories.property.PropertyBuildingRepository;
import tn.esprit.pidev.entities.property.Apartment;
import tn.esprit.pidev.entities.property.Building;


import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final AccountRepository accountRepository;
    private final OrganizationRepository organizationRepository;
    private final AuditLogRepository auditLogRepository;
    private final StaffProfileRepository staffProfileRepository;
    private final ResidentProfileRepository residentProfileRepository;
    private final IChargeRepo chargeRepo;
    private final IExpenseRepo expenseRepo;
    private final IPaymentRepo paymentRepo;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final LeaseRepository leaseRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApartmentRepository apartmentRepository;
    private final PropertyBuildingRepository propertyBuildingRepository;

    // ═══════════════════════════════════════════
    //  DASHBOARD AGGREGATION
    // ═══════════════════════════════════════════

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalOrganizations", organizationRepository.count());
        stats.put("totalAccounts", accountRepository.count());
        stats.put("activeAccounts", accountRepository.countByStatus(AccountStatus.ACTIVE));
        stats.put("suspendedAccounts", accountRepository.countByStatus(AccountStatus.SUSPENDED));
        stats.put("totalResidents", accountRepository.countByRole(AccountRole.RESIDENT));
        stats.put("totalStaff", accountRepository.countByRole(AccountRole.TECHNICAL_STAFF));
        stats.put("totalSyndicAdmins", accountRepository.countByRole(AccountRole.SYNDIC_ADMIN));
        stats.put("totalCharges", chargeRepo.count());
        stats.put("totalExpenses", expenseRepo.count());
        stats.put("totalPayments", paymentRepo.count());
        stats.put("totalMaintenanceRequests", maintenanceRequestRepository.count());
        stats.put("totalLeases", leaseRepository.count());

        // Revenue aggregation
        double totalChargeAmount = chargeRepo.findAll().stream()
                .mapToDouble(c -> c.getAmount() != null ? c.getAmount() : 0.0)
                .sum();
        double totalExpenseAmount = expenseRepo.findAll().stream()
                .mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0)
                .sum();
        double totalCollected = chargeRepo.findAll().stream()
                .mapToDouble(c -> c.getPaidAmount() != null ? c.getPaidAmount() : 0.0)
                .sum();
        stats.put("totalChargeAmount", totalChargeAmount);
        stats.put("totalExpenseAmount", totalExpenseAmount);
        stats.put("totalCollected", totalCollected);
        stats.put("netRevenue", totalCollected - totalExpenseAmount);
        return stats;
    }

    // ═══════════════════════════════════════════
    //  ACCOUNT MANAGEMENT
    // ═══════════════════════════════════════════

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public List<Account> getAccountsByRole(AccountRole role) {
        return accountRepository.findByRole(role);
    }

    public List<Account> getAccountsByOrganization(String orgId) {
        return accountRepository.findByOrganizationId(orgId);
    }

    public List<Account> getResidentsForOrganization(String orgId) {
        return accountRepository.findByOrganizationId(orgId).stream()
                .filter(acc -> acc.getRole() == AccountRole.RESIDENT)
                .collect(Collectors.toList());
    }

    public Account getAccountById(String id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Account not found: " + id));
    }

    public Account createAccount(String email, String firstName, String lastName,
                                  String phone, AccountRole role, String organizationId,
                                  String password, String jobTitle, String department,
                                  List<String> specializations) {
        if (accountRepository.existsByEmail(email)) {
            throw new ConflictException("Email already registered: " + email);
        }

        Account account = Account.builder()
                .organizationId(organizationId)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .role(role)
                .status(AccountStatus.ACTIVE)
                .firstName(firstName)
                .lastName(lastName)
                .phone(phone)
                .build();
        account = accountRepository.save(account);

        // Create role-specific profile
        if (role == AccountRole.RESIDENT) {
            ResidentProfile profile = ResidentProfile.builder()
                    .accountId(account.getId())
                    .organizationId(organizationId)
                    .build();
            residentProfileRepository.save(profile);
        } else if (role == AccountRole.TECHNICAL_STAFF) {
            StaffProfile profile = StaffProfile.builder()
                    .accountId(account.getId())
                    .organizationId(organizationId)
                    .jobTitle(jobTitle != null ? jobTitle : "Technician")
                    .department(department)
                    .specializations(specializations != null ? specializations : new ArrayList<>())
                    .build();
            staffProfileRepository.save(profile);
        }

        log.info("Admin created account {} with role {}", account.getId(), role);
        return account;
    }

    public Account updateAccount(String id, String email, String firstName,
                                  String lastName, String phone, AccountRole role) {
        Account account = getAccountById(id);
        if (email != null && !email.equals(account.getEmail())) {
            if (accountRepository.existsByEmail(email)) {
                throw new ConflictException("Email already in use: " + email);
            }
            account.setEmail(email);
        }
        if (firstName != null) account.setFirstName(firstName);
        if (lastName != null) account.setLastName(lastName);
        if (phone != null) account.setPhone(phone);
        if (role != null) account.setRole(role);
        log.info("Admin updated account {}", id);
        return accountRepository.save(account);
    }

    public Account updateAccountStatus(String id, AccountStatus status) {
        Account account = getAccountById(id);
        account.setStatus(status);
        log.info("Admin changed account {} status to {}", id, status);
        return accountRepository.save(account);
    }

    public void resetAccountPassword(String id, String newPassword) {
        Account account = getAccountById(id);
        account.setPasswordHash(passwordEncoder.encode(newPassword));
        accountRepository.save(account);
        log.info("Admin reset password for account {}", id);
    }

    // ═══════════════════════════════════════════
    //  ORGANIZATION MANAGEMENT
    // ═══════════════════════════════════════════

    public List<Organization> getAllOrganizations() {
        return organizationRepository.findAll();
    }

    public Organization getOrganizationById(String id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Organization not found: " + id));
    }

    public Organization createOrganization(String name, String address, String city,
                                            SubscriptionPlan plan) {
        Organization org = Organization.builder()
                .name(name)
                .address(address)
                .city(city)
                .subscriptionPlan(plan != null ? plan : SubscriptionPlan.BASIC)
                .status(OrganizationStatus.ACTIVE)
                .build();
        log.info("Admin created organization: {}", name);
        return organizationRepository.save(org);
    }

    public Organization updateOrganization(String id, String name, String address,
                                            String city, SubscriptionPlan plan) {
        Organization org = getOrganizationById(id);
        if (name != null) org.setName(name);
        if (address != null) org.setAddress(address);
        if (city != null) org.setCity(city);
        if (plan != null) org.setSubscriptionPlan(plan);
        log.info("Admin updated organization {}", id);
        return organizationRepository.save(org);
    }

    public Organization updateOrganizationStatus(String id, OrganizationStatus status) {
        Organization org = getOrganizationById(id);
        org.setStatus(status);
        log.info("Admin changed org {} status to {}", id, status);
        return organizationRepository.save(org);
    }

    // ═══════════════════════════════════════════
    //  FINANCE AGGREGATION
    // ═══════════════════════════════════════════

    public Map<String, Object> getFinanceSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("charges", chargeRepo.findAll());
        summary.put("expenses", expenseRepo.findAll());
        summary.put("payments", paymentRepo.findAll());

        double totalCharged = chargeRepo.findAll().stream()
                .mapToDouble(c -> c.getAmount() != null ? c.getAmount() : 0.0).sum();
        double totalCollected = chargeRepo.findAll().stream()
                .mapToDouble(c -> c.getPaidAmount() != null ? c.getPaidAmount() : 0.0).sum();
        double totalExpenses = expenseRepo.findAll().stream()
                .mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0).sum();

        summary.put("totalCharged", totalCharged);
        summary.put("totalCollected", totalCollected);
        summary.put("totalExpenses", totalExpenses);
        summary.put("netRevenue", totalCollected - totalExpenses);
        return summary;
    }

    // ═══════════════════════════════════════════
    //  AUDIT LOGS
    // ═══════════════════════════════════════════

    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findAll();
    }

    // ═══════════════════════════════════════════
    //  RESIDENT-APARTMENT MAPPING
    // ═══════════════════════════════════════════

    public List<Map<String, Object>> getResidentsWithApartmentInfo(String organizationId) {
        List<Map<String, Object>> result = new ArrayList<>();
        
        // Get all resident profiles for the organization
        List<ResidentProfile> profiles = residentProfileRepository.findByOrganizationId(organizationId);
        
        for (ResidentProfile profile : profiles) {
            // Get account details
            Optional<Account> accountOpt = accountRepository.findById(profile.getAccountId());
            if (!accountOpt.isPresent()) continue;
            Account account = accountOpt.get();
            
            Map<String, Object> residentInfo = new LinkedHashMap<>();
            residentInfo.put("accountId", account.getId());
            residentInfo.put("firstName", account.getFirstName());
            residentInfo.put("lastName", account.getLastName());
            residentInfo.put("email", account.getEmail());
            
            // Get apartment details if assigned
            if (profile.getApartmentId() != null) {
                Optional<Apartment> apartmentOpt = apartmentRepository.findById(profile.getApartmentId());
                if (apartmentOpt.isPresent()) {
                    Apartment apartment = apartmentOpt.get();
                    residentInfo.put("apartmentId", apartment.getId());
                    residentInfo.put("apartmentNumber", apartment.getUnitNumber());
                    residentInfo.put("floor", apartment.getFloor());
                    
                    // Get building details
                    if (apartment.getBuildingId() != null) {
                        Optional<Building> buildingOpt = propertyBuildingRepository.findById(apartment.getBuildingId());
                        if (buildingOpt.isPresent()) {
                            Building building = buildingOpt.get();
                            residentInfo.put("buildingId", building.getId());
                            residentInfo.put("buildingName", building.getName());
                        }
                    }
                }
            } else {
                // Resident not assigned to apartment yet
                residentInfo.put("apartmentId", null);
                residentInfo.put("apartmentNumber", null);
                residentInfo.put("floor", null);
                residentInfo.put("buildingId", null);
                residentInfo.put("buildingName", null);
            }
            
            result.add(residentInfo);
        }
        
        log.info("Retrieved {} residents with apartment info for organization {}", result.size(), organizationId);
        return result;
    }
}
