package com.finflow.core.family.dto;

import com.finflow.core.family.domain.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.List;

@Data
public class FamilyCreateRequest {
    @NotBlank(message = "Tên gia đình không được để trống")
    private String name;

    @Min(value = 1, message = "Ngày nhỏ nhất là 1")
    @Max(value = 31, message = "Ngày lớn nhất là 31")
    private Integer billingDate;

    @NotBlank(message = "Email người tạo không được để trống")
    private String creatorEmail;
}