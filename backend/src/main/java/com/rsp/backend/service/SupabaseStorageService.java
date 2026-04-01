package com.rsp.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupabaseStorageService {

    private final WebClient.Builder webClientBuilder;

    @Value("${app.supabase.url}")
    private String supabaseUrl;

    @Value("${app.supabase.service-key}")
    private String supabaseServiceKey;

    @Value("${app.supabase.bucket:files}")
    private String bucket;

    public SupabaseUploadResult upload(MultipartFile file, String folderPath) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String objectPath = folderPath + "/" + UUID.randomUUID() + "_" + safeName;

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read file");
        }

        MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;
        if (file.getContentType() != null && !file.getContentType().isBlank()) {
            contentType = MediaType.parseMediaType(file.getContentType());
        }

        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + objectPath;

        webClientBuilder.build()
                .post()
                .uri(uploadUrl)
                .contentType(contentType)
                .header("Authorization", "Bearer " + supabaseServiceKey)
                .header("x-upsert", "true")
                .bodyValue(bytes)
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), response ->
                        response.bodyToMono(String.class)
                                .map(body -> new ResponseStatusException(
                                        HttpStatus.BAD_GATEWAY,
                                        "Supabase upload failed: " + body)))
                .toBodilessEntity()
                .block();

        String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + objectPath;
        return new SupabaseUploadResult(objectPath, publicUrl);
    }

    public record SupabaseUploadResult(String objectPath, String publicUrl) {}
}
