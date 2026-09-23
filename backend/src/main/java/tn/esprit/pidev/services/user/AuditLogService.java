package tn.esprit.pidev.services.user;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.user.AuditLog;
import tn.esprit.pidev.repositories.user.AuditLogRepository;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(String accountId, String action, String ip, String userAgent, String details) {
        AuditLog auditLog = AuditLog.builder()
                .accountId(accountId)
                .action(action)
                .ip(ip)
                .userAgent(userAgent)
                .details(details)
                .build();
        auditLogRepository.save(auditLog);
    }
}


