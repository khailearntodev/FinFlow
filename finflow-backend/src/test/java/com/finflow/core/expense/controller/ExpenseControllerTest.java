package com.finflow.core.expense.controller;

import com.finflow.core.enums.ExpenseStatus;
import com.finflow.core.exception.ExpenseException;
import com.finflow.core.exception.GlobalExceptionHandler;
import com.finflow.core.expense.dto.ExpenseCreateRequest;
import com.finflow.core.expense.dto.ExpenseResponse;
import com.finflow.core.expense.service.ExpenseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ExpenseControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ExpenseService expenseService;

    @InjectMocks
    private ExpenseController expenseController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(expenseController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .defaultResponseCharacterEncoding(StandardCharsets.UTF_8)
                .build();
    }

    @Test
    @DisplayName("POST /api/expense/create creates an expense successfully")
    void createExpense_validRequest_returnsSuccess() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID p1 = UUID.randomUUID();
        UUID p2 = UUID.randomUUID();
        when(expenseService.createExpense(any(ExpenseCreateRequest.class), eq(userId))).thenReturn(null);

        String payload = """
                {
                  "title": "Đi siêu thị Winmart",
                  "amount": 350000,
                  "expenseDate": "%s",
                  "paidByEmail": "head@gmail.com",
                  "participantIDs": ["%s", "%s"]
                }
                """.formatted(LocalDate.now(), p1, p2);

        mockMvc.perform(post("/api/expense/create")
                        .param("userId", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(new MediaType("text", "plain", StandardCharsets.UTF_8))
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().string("Đã tạo bản ghi chi tiêu thành công!"));

        verify(expenseService).createExpense(any(ExpenseCreateRequest.class), eq(userId));
    }

    @Test
    @DisplayName("GET /api/expense/get returns expense details by id")
    void getExpenseById_found_returnsExpense() throws Exception {
        UUID familyId = UUID.randomUUID();
        UUID expenseId = UUID.randomUUID();
        ExpenseResponse response = ExpenseResponse.builder()
                .id(expenseId.toString())
                .title("Tiền điện tháng 10")
                .amount(new BigDecimal("1200000"))
                .expenseDate(LocalDate.now())
                .paidByEmail("head@gmail.com")
                .participants(List.of("head@gmail.com", "member@gmail.com"))
                .status(ExpenseStatus.PENDING)
                .build();

        when(expenseService.getExpenseById(familyId, expenseId)).thenReturn(response);

        mockMvc.perform(get("/api/expense/get")
                        .param("familyId", familyId.toString())
                        .param("expenseId", expenseId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Tiền điện tháng 10"))
                .andExpect(jsonPath("$.amount").value(1200000))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("GET /api/expense/get-all returns list of family expenses")
    void getAllExpenses_returnsList() throws Exception {
        UUID familyId = UUID.randomUUID();
        ExpenseResponse exp = ExpenseResponse.builder()
                .id(UUID.randomUUID().toString())
                .title("Tiền nước")
                .amount(new BigDecimal("180000"))
                .expenseDate(LocalDate.now())
                .paidByEmail("member@gmail.com")
                .participants(List.of("head@gmail.com", "member@gmail.com"))
                .status(ExpenseStatus.PENDING)
                .build();

        when(expenseService.getAllExpensesByFamilyId(familyId)).thenReturn(List.of(exp));

        mockMvc.perform(get("/api/expense/get-all")
                        .param("familyId", familyId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Tiền nước"));
    }

    @Test
    @DisplayName("PUT /api/expense/update updates expense successfully")
    void updateExpense_validRequest_returnsUpdatedExpense() throws Exception {
        UUID familyId = UUID.randomUUID();
        UUID expenseId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID p1 = UUID.randomUUID();
        UUID p2 = UUID.randomUUID();

        ExpenseResponse updated = ExpenseResponse.builder()
                .id(expenseId.toString())
                .title("Tiền điện cập nhật")
                .amount(new BigDecimal("1350000"))
                .expenseDate(LocalDate.now())
                .paidByEmail("head@gmail.com")
                .participants(List.of("head@gmail.com", "member@gmail.com"))
                .status(ExpenseStatus.PENDING)
                .build();

        when(expenseService.updateExpense(eq(familyId), eq(expenseId), any(ExpenseCreateRequest.class), eq(userId)))
                .thenReturn(updated);

        String payload = """
                {
                  "title": "Tiền điện cập nhật",
                  "amount": 1350000,
                  "expenseDate": "%s",
                  "paidByEmail": "head@gmail.com",
                  "participantIDs": ["%s", "%s"]
                }
                """.formatted(LocalDate.now(), p1, p2);

        mockMvc.perform(put("/api/expense/update")
                        .param("familyId", familyId.toString())
                        .param("expenseId", expenseId.toString())
                        .param("userId", userId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Tiền điện cập nhật"))
                .andExpect(jsonPath("$.amount").value(1350000));
    }

    @Test
    @DisplayName("DELETE /api/expense/{expenseId} deletes expense successfully")
    void deleteExpense_pending_returnsSuccess() throws Exception {
        UUID familyId = UUID.randomUUID();
        UUID expenseId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        doNothing().when(expenseService).deleteExpense(familyId, expenseId, userId);

        mockMvc.perform(delete("/api/expense/{expenseId}", expenseId)
                        .param("familyId", familyId.toString())
                        .param("userId", userId.toString())
                        .accept(new MediaType("text", "plain", StandardCharsets.UTF_8)))
                .andExpect(status().isOk())
                .andExpect(content().string("Đã xóa khoản chi thành công"));

        verify(expenseService).deleteExpense(familyId, expenseId, userId);
    }

    @Test
    @DisplayName("DELETE /api/expense/{expenseId} returns 400 when expense is already settled")
    void deleteExpense_settled_returnsBadRequest() throws Exception {
        UUID familyId = UUID.randomUUID();
        UUID expenseId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        doThrow(new ExpenseException("Không thể xóa khoản chi đã chốt sổ"))
                .when(expenseService).deleteExpense(familyId, expenseId, userId);

        mockMvc.perform(delete("/api/expense/{expenseId}", expenseId)
                        .param("familyId", familyId.toString())
                        .param("userId", userId.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Không thể xóa khoản chi đã chốt sổ"));
    }

    @Test
    @DisplayName("GET /api/expense/export-excel returns xlsx binary stream with attachment header")
    void exportExcel_returnsXlsxBytes() throws Exception {
        UUID familyId = UUID.randomUUID();
        byte[] fakeXlsx = new byte[]{0x50, 0x4B, 0x03, 0x04};
        when(expenseService.exportMonthlyExpensesToExcel(familyId, 11, 2026)).thenReturn(fakeXlsx);

        mockMvc.perform(get("/api/expense/export-excel")
                        .param("familyId", familyId.toString())
                        .param("month", "11")
                        .param("year", "2026"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        containsString("Chi_Tieu_Thang_11_2026.xlsx")))
                .andExpect(content().bytes(fakeXlsx));
    }
}
