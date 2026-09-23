package tn.esprit.pidev.services.solarenergy;

import java.util.Locale;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

@Getter
@AllArgsConstructor
enum WeatherCondition {
    SUNNY(1.0),
    PARTLY_CLOUDY(0.65), // Adjusted for Tunisian dust/haze
    CLOUDY(0.35),
    RAINY(0.15),
    STORM(0.05);

    private final double multiplier;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class DayWeather {
    private LocalDate date;
    private WeatherCondition condition;
    private double temperature;
}

@Service
public class WeatherService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final double tunisLat = 36.8065;
    private final double tunisLon = 10.1815;

    private LocalDateTime lastFetch;
    private List<DayWeather> cachedForecast;

    public List<DayWeather> getForecast(LocalDate startDate) {
        LocalDateTime now = LocalDateTime.now();
        if (cachedForecast != null && lastFetch != null && lastFetch.isAfter(now.minusHours(1))) {
            return cachedForecast;
        }

        try {
            String url = "https://api.open-meteo.com/v1/forecast?latitude=" + tunisLat + 
                         "&longitude=" + tunisLon + 
                         "&daily=weather_code,temperature_2m_max&timezone=auto";
            System.out.println("[+] Fetching weather from: " + url);
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response == null || !response.containsKey("daily")) {
                return fallbackSimulation(startDate);
            }

            Map<String, Object> daily = (Map<String, Object>) response.get("daily");
            List<String> times = (List<String>) daily.getOrDefault("time", Collections.emptyList());
            List<Number> codes = (List<Number>) daily.getOrDefault("weather_code", Collections.emptyList());
            List<Number> temps = (List<Number>) daily.getOrDefault("temperature_2m_max", Collections.emptyList());

            List<DayWeather> forecast = IntStream.range(0, Math.min(times.size(), 7))
                    .mapToObj(i -> {
                        LocalDate date = LocalDate.parse(times.get(i));
                        int wmoCode = codes.get(i).intValue();
                        WeatherCondition condition = mapWmoCodeToCondition(wmoCode);
                        double temp = temps.get(i).doubleValue();

                        return DayWeather.builder()
                                .date(date)
                                .condition(condition)
                                .temperature(temp)
                                .build();
                    })
                    .toList();

            cachedForecast = forecast;
            lastFetch = now;
            return forecast;
        } catch (Exception e) {
            System.err.println("[-] Weather API Error: " + e.getMessage() + ". Falling back to simulation.");
            return fallbackSimulation(startDate);
        }
    }

    private WeatherCondition mapWmoCodeToCondition(int wmoCode) {
        if (wmoCode == 0) return WeatherCondition.SUNNY;
        if (wmoCode == 1 || wmoCode == 2) return WeatherCondition.PARTLY_CLOUDY;
        if (wmoCode == 3) return WeatherCondition.CLOUDY;
        if (wmoCode == 45 || wmoCode == 48) return WeatherCondition.CLOUDY;
        if (wmoCode >= 51 && wmoCode <= 67) return WeatherCondition.RAINY;
        if (wmoCode >= 80 && wmoCode <= 99) return WeatherCondition.STORM;
        return WeatherCondition.SUNNY;
    }

    private List<DayWeather> fallbackSimulation(LocalDate startDate) {
        List<DayWeather> simulation = new ArrayList<>();
        // Tunisian average: more sunny, higher temps
        for (int i = 0; i < 7; i++) {
            simulation.add(DayWeather.builder()
                    .date(startDate.plusDays(i))
                    .condition(WeatherCondition.SUNNY)
                    .temperature(28.0) // Higher baseline for Tunisia
                    .build());
        }
        return simulation;
    }
}
