package com.finflow.core.audit.controller;

import com.finflow.core.audit.domain.AuditLog;
import com.finflow.core.audit.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {
    private final AuditService auditService;

    @GetMapping("/family/{familyId}")
    public ResponseEntity<Page<AuditLog>> getLogs(
            @PathVariable UUID familyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(auditService.getLogsByFamilyId(familyId, page, size, search));
    }
}
