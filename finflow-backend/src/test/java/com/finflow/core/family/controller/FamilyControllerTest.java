package com.finflow.core.family.controller;

import com.finflow.core.exception.FamilyException;
import com.finflow.core.exception.GlobalExceptionHandler;
import com.finflow.core.family.dto.AddMemberRequest;
import com.finflow.core.family.dto.FamilyCreateRequest;
import com.finflow.core.family.dto.FamilyResponse;
import com.finflow.core.family.dto.FamilyUpdateRequest;
import com.finflow.core.family.dto.RevokeMemberRequest;
import com.finflow.core.family.service.FamilyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class FamilyControllerTest {

    private MockMvc mockMvc;

    @Mock
    private FamilyService familyService;

    @InjectMocks
    private FamilyController familyController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(familyController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .defaultResponseCharacterEncoding(StandardCharsets.UTF_8)
                .build();
    }

    @Test
    @DisplayName("POST /api/family/ creates a family successfully")
    void createFamily_validRequest_returnsFamilyResponse() throws Exception {
        UUID familyId = UUID.randomUUID();
        FamilyResponse response = FamilyResponse.builder()
                .id(familyId)
                .name("Căn hộ 402")
                .billingDate(25)
                .message("Tạo gia đình thành công")
                .build();

        when(familyService.createFamily(any(FamilyCreateRequest.class))).thenReturn(response);

        String payload = """
                {
                  "name": "Căn hộ 402",
                  "billingDate": 25,
                  "creatorEmail": "head@gmail.com"
                }
                """;

        mockMvc.perform(post("/api/family/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(familyId.toString()))
                .andExpect(jsonPath("$.name").value("Căn hộ 402"))
                .andExpect(jsonPath("$.billingDate").value(25));

        verify(familyService).createFamily(any(FamilyCreateRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/family/delete/{id} disbands family when authorized")
    void deleteFamily_authorized_returnsSuccessMessage() throws Exception {
        UUID familyId = UUID.randomUUID();
        doNothing().when(familyService).deleteFamily(familyId, "head@gmail.com");

        mockMvc.perform(delete("/api/family/delete/{id}", familyId)
                        .param("email", "head@gmail.com")
                        .accept(new MediaType("text", "plain", StandardCharsets.UTF_8)))
                .andExpect(status().isOk())
                .andExpect(content().string("Xóa gia đình thành công"));

        verify(familyService).deleteFamily(familyId, "head@gmail.com");
    }

    @Test
    @DisplayName("DELETE /api/family/delete/{id} returns 400 when unauthorized")
    void deleteFamily_unauthorized_returnsBadRequest() throws Exception {
        UUID familyId = UUID.randomUUID();
        doThrow(new FamilyException("Chỉ chủ hộ mới có quyền xóa gia đình"))
                .when(familyService).deleteFamily(familyId, "member@gmail.com");

        mockMvc.perform(delete("/api/family/delete/{id}", familyId)
                        .param("email", "member@gmail.com"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Chỉ chủ hộ mới có quyền xóa gia đình"));
    }

    @Test
    @DisplayName("POST /api/family/add adds members to family")
    void addMember_validRequest_returnsSuccessMessage() throws Exception {
        UUID familyId = UUID.randomUUID();
        doNothing().when(familyService).addMemberToFamily(any(AddMemberRequest.class));

        String payload = """
                {
                  "adderEmail": "head@gmail.com",
                  "userEmail": ["member1@gmail.com", "member2@gmail.com"],
                  "familyId": "%s"
                }
                """.formatted(familyId);

        mockMvc.perform(post("/api/family/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("member1@gmail.com, member2@gmail.com")));

        verify(familyService).addMemberToFamily(any(AddMemberRequest.class));
    }

    @Test
    @DisplayName("POST /api/family/revoke removes members from family")
    void revokeMember_validRequest_returnsSuccessMessage() throws Exception {
        UUID familyId = UUID.randomUUID();
        doNothing().when(familyService).evictMember(any(RevokeMemberRequest.class));

        String payload = """
                {
                  "adderEmail": "head@gmail.com",
                  "userEmail": ["member1@gmail.com"],
                  "familyId": "%s"
                }
                """.formatted(familyId);

        mockMvc.perform(post("/api/family/revoke")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("member1@gmail.com")));

        verify(familyService).evictMember(any(RevokeMemberRequest.class));
    }

    @Test
    @DisplayName("PUT /api/family/update updates family name and billing date")
    void updateFamily_validRequest_returnsUpdatedFamily() throws Exception {
        UUID familyId = UUID.randomUUID();
        FamilyResponse response = FamilyResponse.builder()
                .id(familyId)
                .name("Gia đình Mới")
                .billingDate(15)
                .message("Cập nhật thành công")
                .build();

        when(familyService.updateFamily(any(FamilyUpdateRequest.class))).thenReturn(response);

        String payload = """
                {
                  "familyId": "%s",
                  "name": "Gia đình Mới",
                  "billingDate": 15,
                  "requestEmail": "head@gmail.com"
                }
                """.formatted(familyId);

        mockMvc.perform(put("/api/family/update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Gia đình Mới"))
                .andExpect(jsonPath("$.billingDate").value(15));

        verify(familyService).updateFamily(any(FamilyUpdateRequest.class));
    }
}
