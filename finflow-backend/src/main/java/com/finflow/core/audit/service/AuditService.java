package com.finflow.core.audit.service;

import com.finflow.core.audit.domain.AuditLog;
import com.finflow.core.audit.repository.AuditLogRepository;
import com.finflow.core.enums.AuditEnum;
import com.finflow.core.settlement.service.SettlementService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {
    private static final int MAX_PAGE_SIZE = 50;

    private final AuditLogRepository auditLogRepository;
    private final SettlementService settlementService;
    private final com.finflow.core.family.repository.UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void logExpenseChange(UUID familyId, UUID userId, AuditEnum action, UUID expenseId, Object oldData, Object newData) {
        try {
            String oldJson = oldData != null ? objectMapper.writeValueAsString(oldData) : null;
            String newJson = newData != null ? objectMapper.writeValueAsString(newData) : null;

            com.finflow.core.family.domain.User performer = userRepository.findById(userId).orElse(null);

            AuditLog auditLog = AuditLog.builder()
                    .familyId(familyId)
                    .userId(userId)
                    .userFullName(performer != null ? performer.getFullName() : "N/A")
                    .userEmail(performer != null ? performer.getEmail() : "N/A")
                    .action(action)
                    .entityName("expenses")
                    .entityId(expenseId)
                    .oldValues(oldJson)
                    .newValues(newJson)
                    .build();

            auditLogRepository.save(auditLog);
            log.info("Đã ghi Audit Log: {} cho expense_id: {}", action, expenseId);
        } catch (Exception e) {
            log.error("LỖI GHI AUDIT LOG: {}", e.getMessage());
        }
    }

    @Transactional
    public Page<AuditLog> getLogsByFamilyId(UUID familyId, int page, int size, String search) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize);

        if (search != null && !search.trim().isEmpty()) {
            return auditLogRepository.searchByFamilyId(familyId, search.trim(), pageable);
        }
        return auditLogRepository.findByFamilyIdOrderByCreatedAtDesc(familyId, pageable);
    }
}
