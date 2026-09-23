package tn.esprit.pidev.services.financial;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.pidev.dto.financial.OcrResultDTO;
import tn.esprit.pidev.services.financial.ai.GeminiApiClient;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OcrService {

    private final GeminiApiClient geminiApiClient;

    public OcrResultDTO extractBill(MultipartFile billImage) throws Exception {
        log.info("Mocking OCR extraction pending full Gemini Vision implementation");
        
        return OcrResultDTO.builder()
                .issuer("STEG")
                .amount(150.0)
                .date("2024-04-20")
                .description("Facture Electricité")
                .build();
    }
}
