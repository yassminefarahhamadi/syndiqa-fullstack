package tn.esprit.pidev.controllers.aminaStatics;

import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.pidev.dto.IncidentAlert.ExecutionStatsSummary;
import tn.esprit.pidev.dto.IncidentAlert.WeeklyStat;
import tn.esprit.pidev.entities.IncidentAlert.ExecutionStat;
import tn.esprit.pidev.repositories.IncidentAlert.ExecutionStatRepository;

import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@AllArgsConstructor
@RequestMapping("/api/stats")
public class ExecutionStatController {

    private ExecutionStatRepository repository;

    @GetMapping
    public List<ExecutionStat> getAll() {
        return repository.findAll(
            Sort.by(Sort.Direction.DESC, "timestamp")
        );
    }


    @GetMapping("/summary")
    public ExecutionStatsSummary getSummary() {

        List<ExecutionStat> all = repository.findAll();

        if (all.isEmpty()) return new ExecutionStatsSummary(0,0,0);

        double avg = all.stream().mapToLong(ExecutionStat::getDuration).average().orElse(0);
        long total = all.size();
        double errorRate = all.stream().filter(s -> !s.isSuccess()).count() * 100.0 / total;

        return new ExecutionStatsSummary(avg, total, errorRate);
    }

    @GetMapping("/weekly")
    public List<WeeklyStat> getWeeklyStats() {

        List<ExecutionStat> all = repository.findAll();

        if (all.isEmpty()) return new ArrayList<>();

        // Group by week manually
        Map<String, List<ExecutionStat>> grouped = all.stream()
            .collect(Collectors.groupingBy(stat -> {
                Calendar cal = Calendar.getInstance();
                cal.setTime(Date.from(stat.getTimestamp()
                    .atZone(ZoneId.systemDefault()).toInstant()));

                int week = cal.get(Calendar.WEEK_OF_YEAR);
                int year = cal.get(Calendar.YEAR);

                return year + "-W" + week;
            }));

        List<WeeklyStat> result = new ArrayList<>();

        for (String week : grouped.keySet()) {

            List<ExecutionStat> stats = grouped.get(week);

            double avg = stats.stream()
                .mapToLong(ExecutionStat::getDuration)
                .average()
                .orElse(0);

            result.add(new WeeklyStat(week, avg));
        }

        // sort by week
        result.sort(Comparator.comparing(WeeklyStat::getWeek));

        return result;
    }
}
