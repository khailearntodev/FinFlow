package com.finflow.core.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    @Value("${BREVO_API_KEY:}")
    private String brevoApiKey;

    @Value("${SMTP_FROM:}")
    private String fromEmail;

    @Value("${SMTP_FROM_NAME:FinFlow}")
    private String fromName;

    @Value("${FRONTEND_URL:}")
    private String frontendUrl;

    private final RestTemplate restTemplate;

    private EmailService self;

    public EmailService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Autowired
    public void setSelf(@Lazy EmailService self) {
        this.self = self;
    }

    /**
     * Trả về URL deep-link tới màn hình Thanh toán nếu FRONTEND_URL được cấu hình.
     */
    public String buildSettlementLink(int month, int year) {
        if (frontendUrl == null || frontendUrl.isBlank()) {
            return null;
        }
        String base = frontendUrl.trim().replaceAll("/+$", "");
        return base + "/settlement?month=" + month + "&year=" + year;
    }

    /**
     * Lên lịch gửi email bất đồng bộ chỉ sau khi database transaction hiện tại commit thành công.
     */
    public void sendEmailAfterCommit(String to, String subject, String body) {
        EmailService target = self != null ? self : this;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    target.sendEmail(to, subject, body);
                }
            });
        } else {
            target.sendEmail(to, subject, body);
        }
    }

    @Async("emailTaskExecutor")
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

            log.info("Email sent successfully to {} via Brevo API. Status: {}", to, response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to send email to {} via Brevo API: {}", to, e.getMessage());
        }
    }
}
