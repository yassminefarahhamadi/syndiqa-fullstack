package tn.esprit.pidev.services.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.dev-mode:false}")
    private boolean devMode;

    @Async
    public void sendVerificationEmail(String email, String token, String firstName) {
        String subject = "Verify your SyndiQa account";
        String link = baseUrl + "/auth/verify-email?token=" + token;
        String body = String.format(
                "Hello %s,\n\n" +
                "Welcome to SyndiQa! Please verify your email address by clicking the link below:\n\n" +
                "%s\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "If you did not create an account, please ignore this email.\n\n" +
                "Best regards,\nThe SyndiQa Team",
                firstName, link
        );
        sendEmail(email, subject, body);
    }

    @Async
    public void sendInvitationEmail(String email, String token, String inviterName,
                                     String orgName, String role) {
        String subject = "You've been invited to join " + orgName + " on SyndiQa";
        String link = baseUrl + "/auth/accept-invite?token=" + token;
        String body = String.format(
                "Hello,\n\n" +
                "%s has invited you to join %s on SyndiQa as a %s.\n\n" +
                "Click the link below to set up your account:\n\n" +
                "%s\n\n" +
                "This invitation expires in 72 hours.\n\n" +
                "Best regards,\nThe SyndiQa Team",
                inviterName, orgName, role, link
        );
        sendEmail(email, subject, body);
    }

    @Async
    public void sendPasswordResetEmail(String email, String token, String firstName) {
        String subject = "Reset your SyndiQa password";
        String link = baseUrl + "/auth/reset-password?token=" + token;
        String body = String.format(
                "Hello %s,\n\n" +
                "We received a request to reset your password. Click the link below:\n\n" +
                "%s\n\n" +
                "This link will expire in 1 hour.\n\n" +
                "If you did not request a password reset, please ignore this email.\n\n" +
                "Best regards,\nThe SyndiQa Team",
                firstName, link
        );
        sendEmail(email, subject, body);
    }

    @Async
    public void sendAnomalyAlertEmail(String systemId, double currentPower, double expectedPower) {
        String to = "yassminehamadi2@gmail.com";
        String subject = "🚨 Alerte Anomalie : Chute de production - " + systemId;
        String body = String.format(
                "Bonjour,\n\n" +
                "Une anomalie a été détectée sur l'installation solaire : %s.\n\n" +
                "Détails de l'alerte :\n" +
                "- Puissance attendue (moyenne 7 jours) : %.2f W\n" +
                "- Puissance actuelle mesurée : %.2f W\n\n" +
                "La production a chuté de plus de 30%% par rapport à la moyenne.\n" +
                "Veuillez vérifier les capteurs ou l'état des panneaux solaires.\n\n" +
                "Cordialement,\nSyndiQa IA",
                systemId, expectedPower, currentPower
        );
        sendEmail(to, subject, body);
    }

    private void sendEmail(String to, String subject, String body) {
        if (devMode) {
            log.info("\n════════════════════════════════════════════\n" +
                     "  DEV EMAIL\n" +
                     "  To:      {}\n" +
                     "  Subject: {}\n" +
                     "  Body:\n{}\n" +
                     "════════════════════════════════════════════", to, subject, body);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to {}: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}

