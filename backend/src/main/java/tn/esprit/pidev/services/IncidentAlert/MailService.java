package tn.esprit.pidev.services.IncidentAlert;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@syndiqa.com}")
    private String mailFrom;

    public void sendIncidentEmailHtml(String to, String subject, String description,
                                      String severity, String buildingId, String reportedBy) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(to);
        helper.setSubject(subject);
        helper.setFrom("SyndiQA <" + mailFrom + ">");
        // HTML content
        String htmlContent = "<html>" +
            "<body style='font-family:Arial,sans-serif;'>" +
            "<h2 style='color:#D32F2F;'>New Incident Reported</h2>" +
            "<p><strong>Description:</strong> " + description + "</p>" +
            "<p><strong>Severity:</strong> <span style='color:#1976D2;'>" + severity + "</span></p>" +
            "<p><strong>Building ID:</strong> " + buildingId + "</p>" +
            "<p><strong>Reported By:</strong> " + reportedBy + "</p>" +
            "<hr>" +
            "<p style='font-size:small;color:gray;'>This is an automated notification from SyndiQA.</p>" +
            "</body>" +
            "</html>";

        helper.setText(htmlContent, true); // true = HTML

        mailSender.send(message);
    }


    public void sendIncidentEmail(
        String to,
        String domain,
        String description,
        String incidentId
    ) {

        // 🔥 UNIQUE LINK PER TECHNICIAN
        String url = "http://localhost:4200/incidents/"
            + incidentId
            + "/process?tech=" + to;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("New Incident Assigned - " + domain);

        message.setText(
            "Hello,\n\n" +
                "A new incident has been assigned to your domain: " + domain + ".\n\n" +
                "Description:\n" + description + "\n\n" +
                "Click the link below to view and process the incident:\n\n" +
                url + "\n\n" +
                "Important:\n" +
                "- Only the first technician to take it will own the incident.\n\n" +
                "Regards,\n" +
                "Syndiqa Team"
        );

        mailSender.send(message);
        System.out.println("Email sent to: " + to);

    }



}
