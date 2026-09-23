package tn.esprit.pidev.config;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import tn.esprit.pidev.entities.IncidentAlert.ExecutionStat;
import tn.esprit.pidev.repositories.IncidentAlert.ExecutionStatRepository;

import java.time.LocalDateTime;

@Aspect
@Component
public class MonitoringAspect {

    @Autowired
    private ExecutionStatRepository executionStatRepository;

    @Around(
        "execution(* tn.esprit.pidev.controllers.IncidentAlert.AlertController.*(..)) || " +
            "execution(* tn.esprit.pidev.controllers.IncidentAlert.IncidentController.*(..))"
    )
    public Object monitorControllers(ProceedingJoinPoint joinPoint) throws Throwable {

        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().toShortString();

        boolean success = true;
        Object result;

        try {
            result = joinPoint.proceed();
        } catch (Exception e) {
            success = false;

            long duration = System.currentTimeMillis() - startTime;

            // save even if error
            executionStatRepository.save(
                new ExecutionStat(methodName, duration, false, LocalDateTime.now())
            );

            throw e;
        }

        long duration = System.currentTimeMillis() - startTime;

        // ✅ SAVE TO DB
        executionStatRepository.save(
            new ExecutionStat(methodName, duration, true, LocalDateTime.now())
        );

        return result;
    }
}
