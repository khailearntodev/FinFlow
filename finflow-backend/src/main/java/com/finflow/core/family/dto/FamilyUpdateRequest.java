package com.finflow.core.family.dto;
 
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
 
import java.util.UUID;
 
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyUpdateRequest {
    @NotBlank(message = "ID gia đình không được để trống")
    private String familyId;
 
    @NotBlank(message = "Tên gia đình không được để trống")
    private String name;
 
    @Min(value = 1, message = "Ngày chốt sổ tối thiểu là 1")
    @Max(value = 28, message = "Ngày chốt sổ tối đa là 28")
    private int billingDate;
 
    @NotBlank(message = "Email người thực hiện không được để trống")
    private String requestEmail;
}
