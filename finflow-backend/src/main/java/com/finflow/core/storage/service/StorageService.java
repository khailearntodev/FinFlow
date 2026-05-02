package com.finflow.core.storage.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.finflow.core.exception.StorageException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorageService {
    private final Cloudinary cloudinary;

    @Transactional
    public String uploadImage(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new StorageException("File không tồn tại");
            }

            String publicId = "finflow_proof_" + UUID.randomUUID().toString();

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "public_id", publicId,
                            "folder", "finflow/payments"
                    ));

            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            throw new StorageException("Lỗi khi upload file lên Cloud: " + e.getMessage());
        }
    }


}
