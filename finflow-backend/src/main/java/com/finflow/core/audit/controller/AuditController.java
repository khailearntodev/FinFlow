package com.finflow.core.audit.controller;

import com.finflow.core.audit.domain.AuditLog;
import com.finflow.core.audit.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {
    private final AuditService auditService;

    @GetMapping("/family/{familyId}")
    public ResponseEntity<List<AuditLog>> getLogs(@PathVariable UUID familyId) {
        return ResponseEntity.ok(auditService.getLogsByFamilyId(familyId));
    }
}
