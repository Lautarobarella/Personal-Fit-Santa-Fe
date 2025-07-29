package com.personalfit.personalfit.services;

import com.personalfit.personalfit.models.PaymentFile;
import org.springframework.web.multipart.MultipartFile;

import javax.swing.text.html.Option;
import java.util.Optional;

public interface IPaymentFileService {
    Long uploadFile(MultipartFile file);
    byte[] getFile(Long id);
    Long saveFile(String filePath, String fileName, String contentType);
    PaymentFile getFileInfo(Long id);
    PaymentFile getPaymentFile(Long id);
}
