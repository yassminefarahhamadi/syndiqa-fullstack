package tn.esprit.pidev.controllers.solarenergy;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidev.dto.solarenergy.GlobalSolarSummaryDTO;
import tn.esprit.pidev.dto.solarenergy.PredictionResponse;
import tn.esprit.pidev.entities.solarenergy.EnergyReading;
import tn.esprit.pidev.entities.solarenergy.EnergyReport;
import tn.esprit.pidev.repositories.solarenergy.EnergyReadingRepository;
import tn.esprit.pidev.repositories.solarenergy.SolarSystemRepository;
import tn.esprit.pidev.repositories.user.ResidentProfileRepository;
import tn.esprit.pidev.services.solarenergy.EnergyCalculationService;
import tn.esprit.pidev.services.solarenergy.EnergyPredictionService;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/reports")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class EnergyReportController {

    private final EnergyReadingRepository readingRepo;
    private final SolarSystemRepository solarRepo;
    private final ResidentProfileRepository residentRepo;
    private final EnergyCalculationService calc;
    private final EnergyPredictionService predictionService;

    /**
     * GET /reports/summary — Global dashboard summary across all systems.
     */
    @GetMapping("/summary")
    public GlobalSolarSummaryDTO getSummary() {
        var systems = solarRepo.findAll();
        var readings = readingRepo.findAll();
        
        double totalKwh = calc.calculateTotalEnergy(readings);
        
        // Month-to-date filter
        String currentMonthPrefix = LocalDate.now().toString().substring(0, 7); // YYYY-MM
        List<EnergyReading> monthlyReadings = readings.stream()
                .filter(r -> r.getTimestamp().toString().startsWith(currentMonthPrefix))
                .collect(Collectors.toList());
        
        double monthlyKwh = calc.calculateTotalEnergy(monthlyReadings);
        double monthlySavings = calc.estimateSavings(monthlyKwh);

        return GlobalSolarSummaryDTO.builder()
                .totalKwhAllTime(totalKwh)
                .monthlyKwh(monthlyKwh)
                .monthlySavings(monthlySavings)
                .activeSystemsCount((long) systems.size())
                .buildingCount(systems.stream().map(s -> s.getBuildingId()).distinct().count())
                .residentCount(residentRepo.count())
                .totalOutstandingCharges(1250.0) // Placeholder
                .build();
    }

    /**
     * GET /reports/{solarId}/prediction — Forecasts production for the next 7 days.
     */
    @GetMapping("/{solarId}/prediction")
    public PredictionResponse getPrediction(@PathVariable String solarId) {
        return predictionService.predict(solarId);
    }

    /**
     * GET /reports/{solarId} — Dynamically computes a report from stored readings.
     * Reports are never persisted; always computed on demand.
     */
    @GetMapping("/{solarId}")
    public EnergyReport generate(@PathVariable String solarId) {
        List<EnergyReading> readings = readingRepo.findBySolarSystemId(solarId);
        double total = calc.calculateTotalEnergy(readings);
        double savings = calc.estimateSavings(total);

        return EnergyReport.builder()
                .solarSystemId(solarId)
                .period("all-time")
                .totalEnergy(total)
                .savingsEstimation(savings)
                .build();
    }

    /**
     * GET /reports/{solarId}/period?datePrefix=2024-03 — Period report (day or month).
     */
    @GetMapping("/{solarId}/period")
    public tn.esprit.pidev.dto.solarenergy.EnergyReportDTO generateByPeriod(
            @PathVariable String solarId,
            @RequestParam(defaultValue = "") String datePrefix
    ) {
        List<EnergyReading> allReadings = readingRepo.findBySolarSystemId(solarId);
        List<EnergyReading> filtered = datePrefix.isBlank() ? allReadings :
                allReadings.stream()
                        .filter(r -> r.getTimestamp() != null && r.getTimestamp().toString().startsWith(datePrefix))
                        .collect(Collectors.toList());

        double total = calc.calculateTotalEnergy(filtered);
        double savings = calc.estimateSavings(total);

        // Daily aggregation for the chart
        java.util.Map<String, Double> dailyMap = filtered.stream()
                .filter(r -> r.getTimestamp() != null)
                .collect(Collectors.groupingBy(
                        r -> r.getTimestamp().toString().substring(0, 10), // YYYY-MM-DD
                        Collectors.summingDouble(r -> r.getPower() / 1000.0) // Watts to kWh
                ));

        // Time of day distribution for Pie Chart
        java.util.Map<String, Double> periodMap = new java.util.HashMap<>();
        periodMap.put("Morning (6-10h)", 0.0);
        periodMap.put("Midday Peak (10-15h)", 0.0);
        periodMap.put("Afternoon (15-19h)", 0.0);
        periodMap.put("Night/Dusk", 0.0);

        filtered.forEach(r -> {
            if (r.getTimestamp() == null) return;
            int hour = r.getTimestamp().getHour();
            double kwh = r.getPower() / 1000.0;
            
            if (hour >= 6 && hour < 10) {
                periodMap.merge("Morning (6-10h)", kwh, Double::sum);
            } else if (hour >= 10 && hour < 15) {
                periodMap.merge("Midday Peak (10-15h)", kwh, Double::sum);
            } else if (hour >= 15 && hour < 19) {
                periodMap.merge("Afternoon (15-19h)", kwh, Double::sum);
            } else {
                periodMap.merge("Night/Dusk", kwh, Double::sum);
            }
        });

        // Environmental Impact (Tunisian baselines)
        double co2Factor = 0.52; // kg CO2 per kWh (Tunisian average)
        double treeFactor = 0.021; // Tree equivalent per kWh

        return tn.esprit.pidev.dto.solarenergy.EnergyReportDTO.builder()
                .solarSystemId(solarId)
                .period(datePrefix.isBlank() ? "all-time" : datePrefix)
                .totalEnergy(total)
                .savingsEstimation(savings)
                .co2Avoided(total * co2Factor)
                .treesPlantedEquivalent(total * treeFactor)
                .dailyProduction(dailyMap)
                .dailyPeriodDistribution(periodMap)
                .build();
    }
}
