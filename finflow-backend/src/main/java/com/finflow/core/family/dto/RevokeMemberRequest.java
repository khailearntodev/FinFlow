package com.finflow.core.family.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevokeMemberRequest {
    private String adderEmail;

    @Size(min = 1, message = "Phải thêm ít nhất 1 email")
    private List<String> userEmail;

    private UUID familyId;
}
