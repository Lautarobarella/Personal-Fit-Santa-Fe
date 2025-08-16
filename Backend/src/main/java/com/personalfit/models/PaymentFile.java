package com.personalfit.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String filePath;
    private String fileName;      // Nombre original del archivo (o generado)
    private String contentType;
    
    // Metadatos para compresión (opcional, para futuras mejoras)
    private Long originalSize;    // Tamaño original antes de compresión
    private Long compressedSize;  // Tamaño después de compresión
    private Integer compressionRatio; // Porcentaje de compresión aplicado
    private Boolean isCompressed; // Si el archivo fue comprimido

}
