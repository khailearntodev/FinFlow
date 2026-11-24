package com.finflow.core.audit.controller;

import com.finflow.core.audit.domain.AuditLog;
import com.finflow.core.audit.service.AuditService;
import com.finflow.core.enums.AuditEnum;
import com.finflow.core.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuditControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuditController auditController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(auditController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/audit/family/{familyId} returns paginated audit logs with defaults")
    void getLogs_defaultPagination_returnsAuditLogPage() throws Exception {
        UUID familyId = UUID.randomUUID();
        AuditLog log = AuditLog.builder()
                .id(UUID.randomUUID())
                .familyId(familyId)
                .userId(UUID.randomUUID())
                .userFullName("Nguyễn Văn A")
                .userEmail("head@gmail.com")
                .action(AuditEnum.CREATE)
                .entityName("expenses")
                .entityId(UUID.randomUUID())
                .newValues("{\"title\":\"Tiền điện\",\"amount\":500000}")
                .createdAt(ZonedDateTime.now())
                .build();

        Page<AuditLog> pageResult = new PageImpl<>(List.of(log), PageRequest.of(0, 10), 1);
        when(auditService.getLogsByFamilyId(familyId, 0, 10, null)).thenReturn(pageResult);

        mockMvc.perform(get("/api/audit/family/{familyId}", familyId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].action").value("CREATE"))
                .andExpect(jsonPath("$.content[0].entityName").value("expenses"))
                .andExpect(jsonPath("$.content[0].userEmail").value("head@gmail.com"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(10));

        verify(auditService).getLogsByFamilyId(familyId, 0, 10, null);
    }

    @Test
    @DisplayName("GET /api/audit/family/{familyId} forwards custom page, size, and search params")
    void getLogs_customPaginationAndSearch_returnsFilteredPage() throws Exception {
        UUID familyId = UUID.randomUUID();
        Page<AuditLog> pageResult = new PageImpl<>(List.of(), PageRequest.of(2, 5), 10);
        when(auditService.getLogsByFamilyId(familyId, 2, 5, "CREATE")).thenReturn(pageResult);

        mockMvc.perform(get("/api/audit/family/{familyId}", familyId)
                        .param("page", "2")
                        .param("size", "5")
                        .param("search", "CREATE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.totalElements").value(10))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.number").value(2))
                .andExpect(jsonPath("$.size").value(5));

        verify(auditService).getLogsByFamilyId(familyId, 2, 5, "CREATE");
    }
}
