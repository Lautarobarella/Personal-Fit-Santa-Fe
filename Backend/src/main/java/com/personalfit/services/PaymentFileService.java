package com.personalfit.services;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.exceptions.FileException;
import com.personalfit.models.PaymentFile;
import com.personalfit.repository.PaymentFileRepository;

@Service
public class PaymentFileService {

    private final Integer $MAX_FILE_SIZE_MB = 5;
    // private final String $FOLDER_PATH =
    // "C:/Users/tomsh/Documents/Facultad/Proyecto final/Comprobantes/";
    private final String $FOLDER_PATH = "/app/comprobantes/";

    @Autowired
    private PaymentFileRepository fileRepository; // Assuming you have a repository or service to handle file
                                                   // persistence

    
    public Long uploadFile(MultipartFile file) {
        try {
            String fileOriginalName = file.getOriginalFilename();
            if (fileOriginalName == null || fileOriginalName.isBlank()) {
                throw new FileException("El nombre del archivo no puede estar vacío", "Api/PaymentFile/uploadFile");
            }

            // Validar extensión (formato .pdf, .jpg, etc.)
            String extension = fileOriginalName.substring(fileOriginalName.lastIndexOf(".")).toLowerCase();
            if (!List.of(".jpg", ".jpeg", ".png", ".pdf").contains(extension)) {
                throw new FileException("Extensión de archivo no soportada. Solo se permiten: .jpg, .jpeg, .png, .pdf", "Api/PaymentFile/uploadFile");
            }

            // Validar tamaño (en bits → convertimos MB a bits)
            Long fileSizeBits = file.getSize() * 8;
            if (fileSizeBits > $MAX_FILE_SIZE_MB * 1024 * 1024 * 8) {
                throw new FileException("El archivo excede el tamaño máximo permitido de " + $MAX_FILE_SIZE_MB + " MB", "Api/PaymentFile/uploadFile");
            }

            // Generar nuevo nombre aleatorio con extensión
            String newFileName = UUID.randomUUID().toString() + extension;

            // Crear carpeta si no existe
            File folder = new File($FOLDER_PATH);
            if (!folder.exists())
                folder.mkdirs();

            // Guardar el archivo
            Path filePath = folder.toPath().resolve(newFileName);
            Files.write(filePath, file.getBytes());

            String contentType = Files.probeContentType(filePath);

            return saveFile(filePath.toString(), newFileName, contentType);

        } catch (IOException e) {
            throw new BusinessRuleException("Error al guardar el archivo: " + e.getMessage(), "Api/PaymentFile/uploadFile");
        }
    }

    
    public byte[] getFile(Long id) {
        PaymentFile paymentFile = fileRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Archivo no encontrado con id: " + id, "Api/PaymentFile/getFile"));

        Path filePath = Path.of(paymentFile.getFilePath());

        try {
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new BusinessRuleException("No se pudo leer el archivo: " + e.getMessage(), "Api/PaymentFile/getFile");
        }
    }

    
    public Long saveFile(String filePath, String fileName, String contentType) {
        PaymentFile file = PaymentFile.builder()
                .filePath(filePath)
                .fileName(fileName)
                .contentType(contentType)
                .build();

        return fileRepository.save(file).getId();
    }

    
    public PaymentFile getFileInfo(Long id) {
        return fileRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Archivo no encontrado con id: " + id, "Api/PaymentFile/getFileInfo"));
    }

    
    public PaymentFile getPaymentFile(Long id) {
        Optional<PaymentFile> paymentFile = fileRepository.findById(id);
        if (paymentFile.isEmpty())
            throw new EntityNotFoundException("Archivo de pago con ID: " + id + " no encontrado", "Api/PaymentFile/getPaymentFile");
        return paymentFile.get();
    }

}
