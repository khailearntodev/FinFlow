package com.finflow.core.audit.repository;

import com.finflow.core.audit.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByFamilyId(UUID familyId);

    Page<AuditLog> findByFamilyIdOrderByCreatedAtDesc(UUID familyId, Pageable pageable);

    @Query("""
            SELECT a FROM AuditLog a
            WHERE a.familyId = :familyId
              AND (
                LOWER(CAST(a.action AS string)) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(a.entityName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(a.userFullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(a.userEmail, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            ORDER BY a.createdAt DESC
            """)
    Page<AuditLog> searchByFamilyId(
            @Param("familyId") UUID familyId,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Modifying
    @Transactional
    void deleteByFamilyId(UUID familyId);
}
