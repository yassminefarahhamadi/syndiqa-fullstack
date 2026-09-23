package tn.esprit.pidev.services.financial.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.financial.ai.DistributionConfirmResponseDTO;
import tn.esprit.pidev.dto.financial.ai.DistributionPreviewDTO;
import tn.esprit.pidev.dto.financial.ai.DistributionPreviewResponseDTO;
import tn.esprit.pidev.dto.financial.ai.DistributionRequestDTO;
import tn.esprit.pidev.entities.financial.Charge;
import tn.esprit.pidev.entities.financial.ChargeStatus;
import tn.esprit.pidev.entities.user.Apartment;
import tn.esprit.pidev.entities.organization.Lease;
import tn.esprit.pidev.entities.organization.LeaseStatus;
import tn.esprit.pidev.repositories.financial.IChargeRepo;
import tn.esprit.pidev.repositories.user.IApartmentRepo;
import tn.esprit.pidev.repositories.organization.LeaseRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChargeDistributor {

    private final LeaseRepository leaseRepository;
    private final IApartmentRepo apartmentRepository;
    private final IChargeRepo chargeRepository;

    /**
     * AA4 Defense Documentation for Proportional Distribution Algorithm:
     * 
     * Reference to Tunisian Code de la Copropriété: 
     * "Distribution proportionnelle selon l'article X du Code de la Copropriété tunisien — 
     * les charges communes sont réparties en proportion des tantièmes, calculés ici sur la base 
     * de la surface habitable (surfaceM2)."
     * 
     * Why 3 decimal places:
     * "1 TND = 1000 millimes. Rounding to 3 decimal places preserves millime precision 
     * and minimizes cumulative rounding error across residents."
     *
     * Algorithm: Largest Remainder Method
     * Guarantees that sum(proportionalAmounts) == totalAmount exactly.
     * 1. Convert totalAmount to millimes (integer math).
     * 2. Floor each apartment's share to whole millimes.
     * 3. Distribute the residual millimes to entries with the largest fractional remainders.
     */
    public DistributionPreviewResponseDTO previewDistribution(String organizationId, DistributionRequestDTO request) {
        log.debug("Previewing charge distribution for org {}", organizationId);

        if (request.getTotalAmount() == null || request.getTotalAmount() <= 0) {
            throw new IllegalArgumentException("Total amount must be positive");
        }

        List<Lease> activeLeases = leaseRepository.findByOrganizationIdAndStatus(organizationId, LeaseStatus.ACTIVE);
        if (activeLeases.isEmpty()) {
            throw new IllegalArgumentException("No active leases found - Check the organization's leases");
        }

        double totalSurface = 0.0;
        List<Object[]> leaseApartmentPairs = new ArrayList<>();
        
        for (Lease lease : activeLeases) {
            if (lease.getApartmentId() != null) {
                Apartment apartment = apartmentRepository.findById(lease.getApartmentId()).orElse(null);
                if (apartment != null && apartment.getSurfaceM2() != null && apartment.getSurfaceM2() > 0) {
                    totalSurface += apartment.getSurfaceM2();
                    leaseApartmentPairs.add(new Object[]{lease, apartment});
                }
            }
        }

        if (totalSurface == 0.0 || leaseApartmentPairs.isEmpty()) {
            throw new IllegalArgumentException("No active leases found - Check the organization's leases");
        }

        List<DistributionPreviewDTO> previews = new ArrayList<>();

        // ════════════════════════════════════════════════════════════════
        //  LARGEST REMAINDER METHOD — guarantees exact balance
        //  Step 1: Calculate raw proportional amounts and floor each
        //  Step 2: Distribute the residual to entries with largest remainders
        // ════════════════════════════════════════════════════════════════

        double[] rawAmounts = new double[leaseApartmentPairs.size()];
        long[] flooredMillimes = new long[leaseApartmentPairs.size()];
        double[] remainders = new double[leaseApartmentPairs.size()];

        long totalMillimes = Math.round(request.getTotalAmount() * 1000.0); // Work in millimes

        long sumFloored = 0;
        for (int i = 0; i < leaseApartmentPairs.size(); i++) {
            Apartment apartment = (Apartment) leaseApartmentPairs.get(i)[1];
            rawAmounts[i] = (apartment.getSurfaceM2() / totalSurface) * totalMillimes;
            flooredMillimes[i] = (long) Math.floor(rawAmounts[i]);
            remainders[i] = rawAmounts[i] - flooredMillimes[i];
            sumFloored += flooredMillimes[i];
        }

        // Distribute residual millimes to entries with largest remainders
        long residual = totalMillimes - sumFloored;
        if (residual > 0) {
            Integer[] indices = new Integer[leaseApartmentPairs.size()];
            for (int i = 0; i < indices.length; i++) indices[i] = i;
            java.util.Arrays.sort(indices, (a, b) -> Double.compare(remainders[b], remainders[a]));
            for (int r = 0; r < residual && r < indices.length; r++) {
                flooredMillimes[indices[r]]++;
            }
        }

        // Build preview DTOs
        double sumCalculated = 0.0;
        for (int i = 0; i < leaseApartmentPairs.size(); i++) {
            Lease lease = (Lease) leaseApartmentPairs.get(i)[0];
            Apartment apartment = (Apartment) leaseApartmentPairs.get(i)[1];

            double proportionalAmount = flooredMillimes[i] / 1000.0;
            double percentage = roundToDecimals((apartment.getSurfaceM2() / totalSurface) * 100.0, 2);
            sumCalculated += proportionalAmount;

            previews.add(DistributionPreviewDTO.builder()
                    .userId(lease.getAccountId())
                    .apartmentId(apartment.getId())
                    .surfaceM2(apartment.getSurfaceM2())
                    .percentage(percentage)
                    .calculatedAmount(proportionalAmount)
                    .build());
        }

        // With the Largest Remainder Method, this will always be true
        boolean balanced = Math.abs(sumCalculated - request.getTotalAmount()) <= 0.001;

        return DistributionPreviewResponseDTO.builder()
                .previews(previews)
                .totalAmount(request.getTotalAmount())
                .sumCalculated(roundToDecimals(sumCalculated, 3))
                .balanced(balanced)
                .build();
    }

    public DistributionConfirmResponseDTO confirmDistribution(String organizationId, DistributionRequestDTO request) {
        log.info("Confirming charge distribution for org {} - amount: {}", organizationId, request.getTotalAmount());
        
        DistributionPreviewResponseDTO previewResponse = previewDistribution(organizationId, request);
        
        List<Charge> chargesToSave = new ArrayList<>();
        for (DistributionPreviewDTO preview : previewResponse.getPreviews()) {
            Charge charge = Charge.builder()
                    .organizationId(organizationId)
                    .userId(preview.getUserId())
                    .label(request.getLabel())
                    .amount(preview.getCalculatedAmount())
                    .paidAmount(0.0)
                    .dueDate(request.getDueDate())
                    .period(request.getPeriod())
                    .status(ChargeStatus.PENDING)
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
            chargesToSave.add(charge);
        }
        
        chargeRepository.saveAll(chargesToSave);
        
        return DistributionConfirmResponseDTO.builder()
                .createdCount(chargesToSave.size())
                .message(chargesToSave.size() + " charges created successfully")
                .build();
    }

    private double roundToDecimals(double value, int places) {
        if (places < 0) throw new IllegalArgumentException();
        BigDecimal bd = new BigDecimal(Double.toString(value));
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }
}
