package com.finflow.core.auth.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng (Ví dụ đúng: name@gmail.com)")
    private String email;

    private String password;
    private String fullName;

    @NotBlank(message = "SĐT không được để trống")
    @Pattern(
            regexp = "^(0|\\+84)[3|5|7|8|9]\\d{8}$",
            message = "Số điện thoại không hợp lệ (Phải đúng chuẩn Việt Nam, VD: 0912345678 hoặc +84912345678)"
    )
    private String phoneNumber;
}
