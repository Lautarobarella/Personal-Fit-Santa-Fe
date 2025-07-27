package com.personalfit.personalfit.services;

import com.personalfit.personalfit.models.PaymentFile;
import org.springframework.web.multipart.MultipartFile;

public interface IPaymentFileService {
    Long uploadFile(MultipartFile file);
    byte[] getFile(Long id);
    Long saveFile(String filePath, String fileName, String contentType);
    PaymentFile getFileInfo(Long id);
}
