package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.services.IFileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private IFileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<Long> uploadFile(MultipartFile file) {
        return ResponseEntity.ok(fileService.uploadFile(file));
    }

}
