package tn.esprit.pidev.services.solarenergy;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.solarenergy.DailyPrediction;
import tn.esprit.pidev.dto.solarenergy.HourlyPrediction;
import tn.esprit.pidev.dto.solarenergy.PredictionResponse;
import tn.esprit.pidev.entities.solarenergy.EnergyReading;
import tn.esprit.pidev.entities.solarenergy.SolarSystem;
import tn.esprit.pidev.repositories.solarenergy.EnergyReadingRepository;
import tn.esprit.pidev.repositories.solarenergy.SolarSystemRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class EnergyPredictionService {

    private final EnergyReadingRepository readingRepo;
    private final SolarSystemRepository systemRepo;
    private final WeatherService weatherService;
    private final EnergyCalculationService calcService;

    public PredictionResponse predict(String solarSystemId) {
        SolarSystem system = systemRepo.findById(solarSystemId).orElseThrow(() ->
            new NoSuchElementException("System " + solarSystemId + " not found")
        );
        
        List<EnergyReading> historicalReadings = readingRepo.findBySolarSystemId(solarSystemId);
        
        // Calculate historical efficiency (if we have data)
        double historicalEfficiency;
        if (!historicalReadings.isEmpty()) {
            double avgPower = historicalReadings.stream()
                    .mapToDouble(EnergyReading::getPower)
                    .average()
                    .orElse(0.0);
            
            double maxPossible = system.getCapacityKw() * 1000.0;
            // Simplified logic: Assume average is half of peak for baseline
            historicalEfficiency = Math.max(0.1, Math.min(1.0, avgPower / (maxPossible / 2.0)));
        } else {
            historicalEfficiency = 0.9; // Default to 90% health for new systems
        }

        List<DayWeather> forecast = weatherService.getForecast(LocalDate.now());

        // Seasonal variation for Tunisia (36°N)
        // Standard deviation based on day length: Summer (June) approx 3.8, Winter (Dec) approx 2.2
        int month = LocalDate.now().getMonthValue();
        double delta = Math.cos(Math.PI * (month - 6) / 6.0); // 1.0 in June, -1.0 in Dec
        double seasonalSigma = 3.0 + (0.8 * delta); 

        // Tunisian Dust/Haze factor (Baseline loss for N. Africa urban areas)
        double tunisDustFactor = 0.945; 

        List<DailyPrediction> predictions = forecast.stream().map(dayWeather -> {
            double wMult = dayWeather.getCondition().getMultiplier();
            double temp = dayWeather.getTemperature();
            
            // Temperature Loss: Solar panels lose approx 0.4% efficiency per °C above 25°C
            // Cell temp is usually higher than air temp by about (intensity * 25)
            // For simplicity, we use (airTemp + 10) as baseline during sunlight
            double tempLoss = 0.0;
            if (temp > 25.0) {
                tempLoss = (temp - 25.0) * 0.004;
            }

            List<HourlyPrediction> hourlyProfile = new ArrayList<>();
            for (int hour = 0; hour < 24; hour++) {
                // Sun Intensity Factor (Bell Curve centered at Solar Noon in Tunis ~13:00 GMT+1)
                double intensity = 0.0;
                if (hour >= 5 && hour <= 20) {
                    intensity = Math.exp(-Math.pow((hour - 13.0), 2.0) / (2 * Math.pow(seasonalSigma, 2.0)));
                }

                // Apply Tunisian model: Capacity * Gaussian Intensity * Weather Multiplier * Hist. Health * Temp Penalty * Dust Penalty
                double expectedPower = (system.getCapacityKw() * 1000.0) 
                                        * intensity 
                                        * wMult 
                                        * historicalEfficiency 
                                        * (1.0 - tempLoss) 
                                        * tunisDustFactor;
                
                hourlyProfile.add(HourlyPrediction.builder()
                        .hour(hour)
                        .expectedPower(expectedPower)
                        .build());
            }

            double totalDailyEnergy = hourlyProfile.stream()
                    .mapToDouble(HourlyPrediction::getExpectedPower)
                    .sum() / 1000.0;
            
            double dailySavings = calcService.estimateSavings(totalDailyEnergy);

            return DailyPrediction.builder()
                    .date(dayWeather.getDate())
                    .expectedTotalEnergy(totalDailyEnergy)
                    .expectedSavings(dailySavings)
                    .primaryWeather(dayWeather.getCondition().name())
                    .hourlyProfile(hourlyProfile)
                    .build();
        }).toList();

        double totalWeeklyEnergy = predictions.stream()
                .mapToDouble(DailyPrediction::getExpectedTotalEnergy)
                .sum();
        
        double totalSavings = calcService.estimateSavings(totalWeeklyEnergy);

        return PredictionResponse.builder()
                .solarSystemId(solarSystemId)
                .predictions(predictions)
                .totalExpectedSavings(totalSavings)
                .build();
    }
}
