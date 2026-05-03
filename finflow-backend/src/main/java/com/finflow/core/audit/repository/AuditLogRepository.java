package com.finflow.core.audit.repository;

import com.finflow.core.audit.domain.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByFamilyId(UUID familyId);
    void deleteByFamilyId(UUID familyId);
}
