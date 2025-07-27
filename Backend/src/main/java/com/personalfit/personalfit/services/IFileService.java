package com.personalfit.personalfit.services;

import org.springframework.web.multipart.MultipartFile;

public interface IFileService {
    Long uploadFile(MultipartFile file);
    void getFile(Long id);
}
