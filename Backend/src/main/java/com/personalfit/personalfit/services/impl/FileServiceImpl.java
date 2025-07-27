package com.personalfit.personalfit.services.impl;

import com.personalfit.personalfit.exceptions.FileSizeException;
import com.personalfit.personalfit.exceptions.UnsupportedFileExtension;
import com.personalfit.personalfit.services.IFileService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class FileServiceImpl implements IFileService {

    private final Integer $MAX_FILE_SIZE_MB = 5;

    @Override
    public Long uploadFile(MultipartFile file) {
        try {
            String fileName = UUID.randomUUID().toString() + "." + file.getOriginalFilename();
            byte[] bytes = file.getBytes();
            String fileOriginalName = file.getOriginalFilename();

            Long fileSize = file.getSize();
            if( fileSize > $MAX_FILE_SIZE_MB * (1024 * 1024 * 8)) throw new FileSizeException();

            if( !fileOriginalName.endsWith(".jpg") &&
                !fileOriginalName.endsWith(".jpeg") &&
                !fileOriginalName.endsWith(".png") &&
                !fileOriginalName.endsWith(".pdf"))
                throw new UnsupportedFileExtension();

        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return 1L; // Placeholder for file upload logic
    }

    @Override
    public void getFile(Long id) {

    }
}
