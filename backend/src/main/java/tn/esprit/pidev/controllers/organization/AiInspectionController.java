package tn.esprit.pidev.controllers.organization;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.pidev.dto.AiAnalysisResultDto;
import tn.esprit.pidev.services.organization.AiVisionService;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiInspectionController {

    private final AiVisionService aiVisionService;

    @PostMapping(value = "/analyze-inspection", consumes = "multipart/form-data")
    public ResponseEntity<AiAnalysisResultDto> analyzeInspection(
        @RequestParam("photos") List<MultipartFile> photos) {
        return ResponseEntity.ok(aiVisionService.analyzeInspectionPhotos(photos));
    }

    @PostMapping(value = "/analyze-item", consumes = "multipart/form-data")
    public ResponseEntity<AiAnalysisResultDto> analyzeItem(
        @RequestParam("photo") MultipartFile photo,
        @RequestParam("itemName") String itemName) {
        return ResponseEntity.ok(aiVisionService.analyzeItemPhoto(itemName, photo));
    }
}
