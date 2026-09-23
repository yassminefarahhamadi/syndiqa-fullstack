package tn.esprit.pidev.services.notification;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SmsService {

    @Value("${twilio.account_sid}")
    private String accountSid;

    @Value("${twilio.auth_token}")
    private String authToken;

    @Value("${twilio.phone_number}")
    private String twilioPhoneNumber;

    @PostConstruct
    public void init() {
        if (accountSid != null) accountSid = accountSid.trim();
        if (authToken != null) authToken = authToken.trim();
        if (twilioPhoneNumber != null) twilioPhoneNumber = twilioPhoneNumber.trim();

        if (accountSid != null && !accountSid.isEmpty() && !"AC_PLACEHOLDER_ACCOUNT_SID".equals(accountSid)) {
            Twilio.init(accountSid, authToken);
            log.info("Twilio SMS Service initialized with SID: {}", accountSid);
        } else {
            log.warn("Twilio SMS Service NOT initialized. Please set valid twilio credentials in application.properties. Current SID: {}", accountSid);
        }
    }

    public void sendAnomalyAlertSms(String toPhoneNumber, String systemId, double currentPower, double baselinePower) {
        if ("AC_PLACEHOLDER_ACCOUNT_SID".equals(accountSid) || accountSid.isEmpty()) {
            log.warn("MOCK SMS SENT to {}: Anomaly detected on system {}! Power dropped to {} W (Baseline: {} W)",
                    toPhoneNumber, systemId, currentPower, baselinePower);
            return;
        }

        try {
            String msgBody = String.format("SYNDIQA ALERT: Anomaly detected on solar system %s! Power dropped to %.1f W (Baseline was %.1f W). Please check the dashboard immediately.",
                    systemId, currentPower, baselinePower);

            Message message = Message.creator(
                    new PhoneNumber(toPhoneNumber),
                    new PhoneNumber(twilioPhoneNumber),
                    msgBody
            ).create();

            log.info("SMS Alert sent successfully. SID: {}", message.getSid());
        } catch (com.twilio.exception.ApiException apiEx) {
            log.error("Twilio API Error sending SMS to {}: {} (Code: {})", toPhoneNumber, apiEx.getMessage(), apiEx.getCode());
        } catch (Exception e) {
            log.error("Unexpected error sending SMS alert to {}", toPhoneNumber, e);
        }
    }
}
