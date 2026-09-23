package tn.esprit.pidev.services.solarenergy;

import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.solarenergy.EnergyReading;

import java.util.List;

@Service
public class EnergyCalculationService {

    /**
     * Sums all power readings (Watts) and converts to kWh.
     * Assumes each reading represents 1-hour interval.
     */
    public double calculateTotalEnergy(List<EnergyReading> readings) {
        return readings.stream()
                .mapToDouble(EnergyReading::getPower)
                .sum() / 1000.0;
    }

    /**
     * Estimates financial savings based on Tunisian STEG pricing rules:
     * - Tranche 1 (<= 200 kWh/month): 181 mill/kWh
     * - Tranche 2 (201-300 kWh/month): 223 mill/kWh
     * - Tranche 3 (301-500 kWh/month): 338 mill/kWh
     * - Tranche 4 (> 500 kWh/month): 419 mill/kWh
     * - Municipal Tax: 5 mill/kWh
     * - TVA: 13%
     */
    public double estimateSavings(double totalEnergy) {
        if (totalEnergy <= 0) return 0.0;

        double baseRate;
        if (totalEnergy <= 200.0) {
            baseRate = 0.181;
        } else if (totalEnergy <= 300.0) {
            baseRate = 0.223;
        } else if (totalEnergy <= 500.0) {
            baseRate = 0.338;
        } else {
            baseRate = 0.419;
        }

        double municipalTax = 0.005;
        double tvaRate = 1.13; // 13% TVA

        return (totalEnergy * (baseRate + municipalTax)) * tvaRate;
    }
}
