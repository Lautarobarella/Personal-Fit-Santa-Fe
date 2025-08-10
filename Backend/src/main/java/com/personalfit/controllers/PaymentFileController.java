package com.personalfit.controllers;

import com.personalfit.models.PaymentFile;
import com.personalfit.services.PaymentFileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class PaymentFileController {

    @Autowired
    private PaymentFileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<Long> uploadFile(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(fileService.uploadFile(file));
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long id) {
        byte[] fileBytes = fileService.getFile(id);
        PaymentFile file = fileService.getFileInfo(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=" + file.getFileName())
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .body(fileBytes);
    }

}
