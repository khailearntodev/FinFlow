package com.finflow.core.expense.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseCreateRequest {
    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    @NotBlank(message = "Số tiền không được trống")
    @Min(value = 1000, message = "Số tiền phải lớn hơn 1000VND")
    private BigDecimal amount;

    @PastOrPresent(message = "Ngày chi tiêu chỉ có thể là quá khứ hoặc hiện tại")
    private LocalDate expenseDate;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email phải đúng định dạng")
    private String paidByEmail;

    @NotNull(message = "Danh sách người tham gia không được trống")
    @Size(min = 2, message = "phải có ít nhất 2 người tham gia chia tiền")
    private List<UUID> participantIDs;
}
