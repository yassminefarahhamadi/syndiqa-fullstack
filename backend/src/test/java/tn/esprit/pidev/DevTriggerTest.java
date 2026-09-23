package tn.esprit.pidev;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import tn.esprit.pidev.controllers.user.DevController;

@SpringBootTest
@ActiveProfiles("dev")
public class DevTriggerTest {

    @Autowired
    private DevController devController;

    @Test
    public void testTriggerAnomaly() {
        try {
            devController.triggerAnomalyDemo();
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
}
