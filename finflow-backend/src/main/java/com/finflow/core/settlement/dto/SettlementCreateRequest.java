package com.finflow.core.settlement.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SettlementCreateRequest {
    @NotNull(message = "Tháng không được để trống")
    @Min(value = 1, message = "Tháng phải lớn hơn 1")
    @Max(value = 12, message = "Tháng phải bé hơn 13")
    private Integer month;

    @NotNull(message = "Năm không được để trống")
    @Min(value = 2000, message = "Năm không hợp lệ")
    private Integer year;

    @Email(message = "Định dạng email không hợp lệ")
    @NotBlank(message = "Email người tạo yêu cầu không được để trống")
    private String holdEmail;

    @NotNull(message = "Gia đình không được để trống")
    private String familyId;
}