package com.finflow.core.audit.service;

import com.finflow.core.audit.domain.AuditLog;
import com.finflow.core.audit.repository.AuditLogRepository;
import com.finflow.core.enums.AuditEnum;
import com.finflow.core.settlement.service.SettlementService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {
    private final AuditLogRepository auditLogRepository;
    private final SettlementService settlementService;
    private final ObjectMapper objectMapper;

    @Transactional
    public void logExpenseChange(UUID familyId, UUID userId, AuditEnum action, UUID expenseId, Object oldData, Object newData) {
        try {
            String oldJson = oldData != null ? objectMapper.writeValueAsString(oldData) : null;
            String newJson = newData != null ? objectMapper.writeValueAsString(newData) : null;

            AuditLog auditLog = AuditLog.builder()
                    .familyId(familyId)
                    .userId(userId)
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
    public java.util.List<AuditLog> getLogsByFamilyId(UUID familyId) {
        return auditLogRepository.findByFamilyId(familyId);
    }
}
