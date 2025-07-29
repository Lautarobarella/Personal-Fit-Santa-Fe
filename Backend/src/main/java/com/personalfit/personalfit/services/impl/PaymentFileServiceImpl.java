package com.personalfit.personalfit.services.impl;

import com.personalfit.personalfit.exceptions.FileSizeException;
import com.personalfit.personalfit.exceptions.NoPaymentFileWithIdException;
import com.personalfit.personalfit.exceptions.UnsupportedFileExtension;
import com.personalfit.personalfit.models.Payment;
import com.personalfit.personalfit.models.PaymentFile;
import com.personalfit.personalfit.repository.IPaymentFileRepository;
import com.personalfit.personalfit.services.IPaymentFileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentFileServiceImpl implements IPaymentFileService {

    private final Integer $MAX_FILE_SIZE_MB = 5;
    private final String $FOLDER_PATH = "/app/files/";

    @Autowired
    private IPaymentFileRepository fileRepository; // Assuming you have a repository or service to handle file persistence

    @Override
    public Long uploadFile(MultipartFile file) {
        try {
            String fileOriginalName = file.getOriginalFilename();
            if (fileOriginalName == null || fileOriginalName.isBlank()) {
                throw new UnsupportedFileExtension();
            }

            // Validar extensión (formato .pdf, .jpg, etc.)
            String extension = fileOriginalName.substring(fileOriginalName.lastIndexOf(".")).toLowerCase();
            if (!List.of(".jpg", ".jpeg", ".png", ".pdf").contains(extension)) {
                throw new UnsupportedFileExtension();
            }

            // Validar tamaño (en bits → convertimos MB a bits)
            Long fileSizeBits = file.getSize() * 8;
            if (fileSizeBits > $MAX_FILE_SIZE_MB * 1024 * 1024 * 8) {
                throw new FileSizeException();
            }

            // Generar nuevo nombre aleatorio con extensión
            String newFileName = UUID.randomUUID().toString() + extension;

            // Crear carpeta si no existe
            File folder = new File($FOLDER_PATH);
            if (!folder.exists()) folder.mkdirs();

            // Guardar el archivo
            Path filePath = folder.toPath().resolve(newFileName);
            Files.write(filePath, file.getBytes());

            String contentType = Files.probeContentType(filePath);

            return saveFile(filePath.toString(), newFileName, contentType);

        } catch (IOException e) {
            throw new RuntimeException("Error al guardar el archivo: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] getFile(Long id) {
        PaymentFile paymentFile = fileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado con id: " + id));

        Path filePath = Path.of(paymentFile.getFilePath());

        try {
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo leer el archivo: " + e.getMessage(), e);
        }
    }


    @Override
    public Long saveFile(String filePath, String fileName, String contentType) {
        PaymentFile file = PaymentFile.builder()
                .filePath(filePath)
                .fileName(fileName)
                .contentType(contentType)
                .build();

        return fileRepository.save(file).getId();
    }

    @Override
    public PaymentFile getFileInfo(Long id) {
        return fileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado con id: " + id));
    }

    @Override
    public PaymentFile getPaymentFile(Long id) {
        Optional<PaymentFile> paymentFile = fileRepository.findById(id);
        if (paymentFile.isEmpty()) throw new NoPaymentFileWithIdException();
        return paymentFile.get();
    }


}
