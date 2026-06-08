package com.finflow.core.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Value("${BREVO_API_KEY}")
    private String brevoApiKey;

    @Value("${SMTP_FROM}")
    private String fromEmail;

    @Value("${SMTP_FROM_NAME:FinFlow}")
    private String fromName;

    private final RestTemplate restTemplate = new RestTemplate();

    @Async
    public void sendEmail(String to, String subject, String body) {
        try {
            String url = "https://api.brevo.com/v3/smtp/email";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("accept", "application/json");
            headers.set("api-key", brevoApiKey);

            Map<String, Object> requestBody = new HashMap<>();
            
            Map<String, String> sender = new HashMap<>();
            sender.put("name", fromName);
            sender.put("email", fromEmail);
            requestBody.put("sender", sender);

            Map<String, String> recipient = new HashMap<>();
            recipient.put("email", to);
            requestBody.put("to", List.of(recipient));

            requestBody.put("subject", subject);
            requestBody.put("htmlContent", body);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
            
            log.info("Email sent successfully to {} via Brevo API. Response: {}", to, response.getBody());
        } catch (Exception e) {
            log.error("Failed to send email to {} via Brevo API: {}", to, e.getMessage());
        }
    }
}
