package tn.esprit.pidev;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("dev")
public class RawMailTest {

    @Autowired
    private JavaMailSender mailSender;

    @Test
    public void testMail() {
        try {
            System.out.println(">>> STARTING DIRECT MAIL DISPATCH <<<");
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom("yassminehamadi2@gmail.com");
            msg.setTo("yassminehamadi2@gmail.com");
            msg.setSubject("Test Direct Mail");
            msg.setText("This is a direct test");
            mailSender.send(msg);
            System.out.println(">>> MAIL SENT SUCCESSFULLY <<<");
        } catch (Exception e) {
            System.err.println(">>> MAIL FAILED TO SEND <<<");
            e.printStackTrace();
            throw new RuntimeException("Force fail", e);
        }
    }
}
