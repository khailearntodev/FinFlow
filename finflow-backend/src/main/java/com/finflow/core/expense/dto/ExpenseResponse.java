package com.finflow.core.expense.dto;

import com.finflow.core.family.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponse {
    private String id;

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

    private List<String> participants;
}
