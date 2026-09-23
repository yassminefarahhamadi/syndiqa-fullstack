package tn.esprit.pidev.controllers.organization;


import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/uploads")
public class FileUploadController {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.upload.base-url:http://localhost:8089/uploads}")
    private String baseUrl;

    /**
     * Upload one or multiple inspection photos.
     * Returns the public URLs to be saved in inspection.photosUrls
     */
    @PostMapping(value = "/inspection-photos", consumes = "multipart/form-data")
    public ResponseEntity<List<String>> uploadInspectionPhotos(
        @RequestParam("files") List<MultipartFile> files) throws IOException {

        Path uploadPath = Paths.get(uploadDir, "inspections");
        Files.createDirectories(uploadPath);

        List<String> urls = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            // Generate unique filename
            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "photo.jpg";
            String extension = original.contains(".")
                ? original.substring(original.lastIndexOf("."))
                : ".jpg";
            String filename = UUID.randomUUID() + extension;

            Path target = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String url = baseUrl + "/inspections/" + filename;
            urls.add(url);
            log.info("Photo uploaded: {}", url);
        }

        return ResponseEntity.ok(urls);
    }

    /**
     * Upload one or multiple maintenance photos (before/after).
     * Returns the public URLs.
     */
    @PostMapping(value = "/maintenance-photos", consumes = "multipart/form-data")
    public ResponseEntity<List<String>> uploadMaintenancePhotos(
        @RequestParam("files") List<MultipartFile> files) throws IOException {

        Path uploadPath = Paths.get(uploadDir, "maintenance");
        Files.createDirectories(uploadPath);

        List<String> urls = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "photo.jpg";
            String extension = original.contains(".")
                ? original.substring(original.lastIndexOf("."))
                : ".jpg";
            String filename = UUID.randomUUID() + extension;

            Path target = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String url = baseUrl + "/maintenance/" + filename;
            urls.add(url);
            log.info("Maintenance photo uploaded: {}", url);
        }

        return ResponseEntity.ok(urls);
    }
}
