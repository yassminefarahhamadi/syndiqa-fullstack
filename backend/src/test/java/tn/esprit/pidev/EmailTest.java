package tn.esprit.pidev;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import tn.esprit.pidev.services.user.EmailService;

@SpringBootTest
@ActiveProfiles("dev")
public class EmailTest {

    @Autowired
    private EmailService emailService;

    @Test
    public void testMail() throws Exception {
        System.out.println("TESTING EMAIL DISPATCH");
        emailService.sendAnomalyAlertEmail("TEST", 200.0, 1000.0);
        // wait for async
        Thread.sleep(5000);
    }
}
