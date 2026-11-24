package com.finflow.core.settlement.controller;

import com.finflow.core.enums.SettlementBillStatusEnum;
import com.finflow.core.enums.SettlementStatusEnum;
import com.finflow.core.exception.GlobalExceptionHandler;
import com.finflow.core.exception.SettlementException;
import com.finflow.core.settlement.dto.BillBreakdownResponse;
import com.finflow.core.settlement.dto.BillDetail;
import com.finflow.core.settlement.dto.SettlementCreateRequest;
import com.finflow.core.settlement.dto.SettlementResponse;
import com.finflow.core.settlement.service.SettlementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SettlementControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SettlementService settlementService;

    @InjectMocks
    private SettlementController settlementController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(settlementController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .defaultResponseCharacterEncoding(StandardCharsets.UTF_8)
                .build();
    }

    @Test
    @DisplayName("POST /api/settlement/create creates monthly settlement")
    void createSettlement_validRequest_returnsSettlement() throws Exception {
        UUID familyId = UUID.randomUUID();
        UUID settlementId = UUID.randomUUID();
        BillDetail bill = BillDetail.builder()
                .id(UUID.randomUUID())
                .userEmail("member@gmail.com")
                .fullName("Thành viên A")
                .amount(new BigDecimal("250000"))
                .status(SettlementBillStatusEnum.PENDING)
                .month(10)
                .year(2026)
                .build();

        SettlementResponse response = SettlementResponse.builder()
                .settlementId(settlementId.toString())
                .month(10)
                .year(2026)
                .status(SettlementStatusEnum.PENDING)
                .createdAt(ZonedDateTime.now())
                .bills(List.of(bill))
                .build();

        when(settlementService.createSettlement(any(SettlementCreateRequest.class))).thenReturn(response);

        String payload = """
                {
                  "month": 10,
                  "year": 2026,
                  "holdEmail": "head@gmail.com",
                  "familyId": "%s"
                }
                """.formatted(familyId);

        mockMvc.perform(post("/api/settlement/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.settlementId").value(settlementId.toString()))
                .andExpect(jsonPath("$.month").value(10))
                .andExpect(jsonPath("$.bills.length()").value(1));
    }

    @Test
    @DisplayName("POST /api/settlement/bills/{billId}/pay uploads payment proof")
    void submitPaymentProof_validFile_returnsSuccess() throws Exception {
        UUID billId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file", "receipt.png", MediaType.IMAGE_PNG_VALUE, "fake-image".getBytes()
        );

        when(settlementService.submitPaymentProof(eq(billId), eq("member@gmail.com"), any()))
                .thenReturn("Nộp minh chứng thành công");

        mockMvc.perform(multipart("/api/settlement/bills/{billId}/pay", billId)
                        .file(file)
                        .param("email", "member@gmail.com")
                        .accept(new MediaType("text", "plain", StandardCharsets.UTF_8)))
                .andExpect(status().isOk())
                .andExpect(content().string("Nộp minh chứng thành công"));
    }

    @Test
    @DisplayName("POST /api/settlement/bills/{billId}/confirm confirms payment")
    void confirmPayment_authorized_returnsSuccess() throws Exception {
        UUID billId = UUID.randomUUID();
        when(settlementService.confirmPayment(billId, "head@gmail.com"))
                .thenReturn("Đã xác nhận thanh toán");

        mockMvc.perform(post("/api/settlement/bills/{billId}/confirm", billId)
                        .param("email", "head@gmail.com")
                        .accept(new MediaType("text", "plain", StandardCharsets.UTF_8)))
                .andExpect(status().isOk())
                .andExpect(content().string("Đã xác nhận thanh toán"));

        verify(settlementService).confirmPayment(billId, "head@gmail.com");
    }

    @Test
    @DisplayName("GET /api/settlement/family/{familyId} lists settlements for family")
    void getSettlements_returnsFamilySettlements() throws Exception {
        UUID familyId = UUID.randomUUID();
        SettlementResponse settlement = SettlementResponse.builder()
                .settlementId(UUID.randomUUID().toString())
                .month(10)
                .year(2026)
                .status(SettlementStatusEnum.COMPLETED)
                .bills(List.of())
                .build();

        when(settlementService.getSettlementsByFamilyId(familyId)).thenReturn(List.of(settlement));

        mockMvc.perform(get("/api/settlement/family/{familyId}", familyId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("COMPLETED"));
    }

    @Test
    @DisplayName("GET /api/settlement/bills/user/{userId} lists bills for user")
    void getMyBills_returnsUserBills() throws Exception {
        UUID userId = UUID.randomUUID();
        BillDetail bill = BillDetail.builder()
                .id(UUID.randomUUID())
                .userEmail("member@gmail.com")
                .fullName("Thành viên A")
                .amount(new BigDecimal("150000"))
                .status(SettlementBillStatusEnum.PENDING)
                .month(10)
                .year(2026)
                .build();

        when(settlementService.getBillsByUserId(userId)).thenReturn(List.of(bill));

        mockMvc.perform(get("/api/settlement/bills/user/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].amount").value(150000));
    }

    @Test
    @DisplayName("DELETE /api/settlement/{settlementId}/cancel cancels settlement")
    void cancelSettlement_authorized_returnsSuccess() throws Exception {
        UUID settlementId = UUID.randomUUID();
        when(settlementService.cancelSettlement(settlementId, "head@gmail.com"))
                .thenReturn("Đã hủy kỳ chốt sổ");

        mockMvc.perform(delete("/api/settlement/{settlementId}/cancel", settlementId)
                        .param("email", "head@gmail.com")
                        .accept(new MediaType("text", "plain", StandardCharsets.UTF_8)))
                .andExpect(status().isOk())
                .andExpect(content().string("Đã hủy kỳ chốt sổ"));
    }

    @Test
    @DisplayName("DELETE /api/settlement/{settlementId}/cancel returns 400 when already completed")
    void cancelSettlement_completed_returnsBadRequest() throws Exception {
        UUID settlementId = UUID.randomUUID();
        when(settlementService.cancelSettlement(settlementId, "head@gmail.com"))
                .thenThrow(new SettlementException("Không thể hủy kỳ chốt sổ đã hoàn tất"));

        mockMvc.perform(delete("/api/settlement/{settlementId}/cancel", settlementId)
                        .param("email", "head@gmail.com"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Không thể hủy kỳ chốt sổ đã hoàn tất"));
    }

    @Test
    @DisplayName("POST /api/settlement/bills/{billId}/remind sends payment reminder email")
    void remindPayment_valid_returnsSuccess() throws Exception {
        UUID billId = UUID.randomUUID();
        when(settlementService.remindPayment(billId, "head@gmail.com"))
                .thenReturn("Đã gửi email nhắc nhở");

        mockMvc.perform(post("/api/settlement/bills/{billId}/remind", billId)
                        .param("email", "head@gmail.com")
                        .accept(new MediaType("text", "plain", StandardCharsets.UTF_8)))
                .andExpect(status().isOk())
                .andExpect(content().string("Đã gửi email nhắc nhở"));

        verify(settlementService).remindPayment(billId, "head@gmail.com");
    }

    @Test
    @DisplayName("GET /api/settlement/bills/{billId}/breakdown returns bill breakdown")
    void getBillBreakdown_valid_returnsBreakdownResponse() throws Exception {
        UUID billId = UUID.randomUUID();
        BillBreakdownResponse breakdown = BillBreakdownResponse.builder()
                .billId(billId)
                .settlementId(UUID.randomUUID())
                .month(10)
                .year(2026)
                .memberFullName("Nguyễn Quang Khải")
                .memberEmail("khai@gmail.com")
                .totalPaid(new BigDecimal("100000"))
                .totalOwed(new BigDecimal("585983"))
                .netAmount(new BigDecimal("485983"))
                .items(List.of())
                .build();

        when(settlementService.getBillBreakdown(billId)).thenReturn(breakdown);

        mockMvc.perform(get("/api/settlement/bills/{billId}/breakdown", billId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberFullName").value("Nguyễn Quang Khải"))
                .andExpect(jsonPath("$.netAmount").value(485983));
    }
}
