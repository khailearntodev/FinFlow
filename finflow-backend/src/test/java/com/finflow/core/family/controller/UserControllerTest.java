package com.finflow.core.family.controller;

import com.finflow.core.enums.RoleEnum;
import com.finflow.core.exception.AuthException;
import com.finflow.core.exception.FamilyException;
import com.finflow.core.exception.GlobalExceptionHandler;
import com.finflow.core.family.dto.ChangePasswordRequest;
import com.finflow.core.family.dto.UpdateProfileRequest;
import com.finflow.core.family.dto.UserProfileResponse;
import com.finflow.core.family.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .defaultResponseCharacterEncoding(StandardCharsets.UTF_8)
                .build();
    }

    @Test
    @DisplayName("GET /api/user/me returns profile with family, members, and bank info")
    void getProfile_withFamily_returnsFullProfile() throws Exception {
        UUID familyId = UUID.randomUUID();
        UserProfileResponse response = UserProfileResponse.builder()
                .id(UUID.randomUUID())
                .fullName("Trần Chủ Hộ")
                .email("head@gmail.com")
                .phoneNumber("0912345678")
                .role(RoleEnum.HEAD)
                .bankCode("MB")
                .bankAccountNumber("0123456789")
                .bankAccountName("TRAN CHU HO")
                .family(UserProfileResponse.FamilyDetail.builder()
                        .id(familyId)
                        .name("Gia đình Hạnh Phúc")
                        .billingDate(25)
                        .members(List.of(
                                UserProfileResponse.MemberDetail.builder()
                                        .id(UUID.randomUUID())
                                        .fullName("Trần Chủ Hộ")
                                        .email("head@gmail.com")
                                        .role(RoleEnum.HEAD)
                                        .build(),
                                UserProfileResponse.MemberDetail.builder()
                                        .id(UUID.randomUUID())
                                        .fullName("Trần Thành Viên")
                                        .email("member@gmail.com")
                                        .role(RoleEnum.USER)
                                        .build()
                        ))
                        .build())
                .build();

        when(userService.getProfile("head@gmail.com")).thenReturn(response);

        mockMvc.perform(get("/api/user/me").param("email", "head@gmail.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("head@gmail.com"))
                .andExpect(jsonPath("$.role").value("HEAD"))
                .andExpect(jsonPath("$.bankCode").value("MB"))
                .andExpect(jsonPath("$.family.name").value("Gia đình Hạnh Phúc"))
                .andExpect(jsonPath("$.family.members.length()").value(2));
    }

    @Test
    @DisplayName("GET /api/user/me returns profile without family when user has none")
    void getProfile_withoutFamily_returnsNullFamily() throws Exception {
        UserProfileResponse response = UserProfileResponse.builder()
                .id(UUID.randomUUID())
                .fullName("Người Dùng Mới")
                .email("newuser@gmail.com")
                .phoneNumber("0901234567")
                .role(RoleEnum.USER)
                .family(null)
                .build();

        when(userService.getProfile("newuser@gmail.com")).thenReturn(response);

        mockMvc.perform(get("/api/user/me").param("email", "newuser@gmail.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newuser@gmail.com"))
                .andExpect(jsonPath("$.family").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/user/me returns 400 when user is not found")
    void getProfile_notFound_returnsBadRequest() throws Exception {
        when(userService.getProfile("missing@gmail.com"))
                .thenThrow(new FamilyException("Không tìm thấy người dùng"));

        mockMvc.perform(get("/api/user/me").param("email", "missing@gmail.com"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Không tìm thấy người dùng"));
    }

    @Test
    @DisplayName("PUT /api/user/me updates profile and bank account info")
    void updateProfile_validRequest_returnsUpdatedProfile() throws Exception {
        UserProfileResponse updated = UserProfileResponse.builder()
                .id(UUID.randomUUID())
                .fullName("Nguyễn Văn B")
                .email("user@gmail.com")
                .phoneNumber("0987654321")
                .role(RoleEnum.HEAD)
                .bankCode("MB")
                .bankAccountNumber("999988887777")
                .bankAccountName("NGUYEN VAN B")
                .build();

        when(userService.updateProfile(any(UpdateProfileRequest.class))).thenReturn(updated);

        String payload = """
                {
                  "email": "user@gmail.com",
                  "fullName": "Nguyễn Văn B",
                  "phoneNumber": "0987654321",
                  "bankCode": "MB",
                  "bankAccountNumber": "999988887777",
                  "bankAccountName": "NGUYEN VAN B"
                }
                """;

        mockMvc.perform(put("/api/user/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Nguyễn Văn B"))
                .andExpect(jsonPath("$.bankCode").value("MB"))
                .andExpect(jsonPath("$.bankAccountNumber").value("999988887777"));

        verify(userService).updateProfile(any(UpdateProfileRequest.class));
    }

    @Test
    @DisplayName("PUT /api/user/password changes password successfully")
    void changePassword_validRequest_returnsSuccess() throws Exception {
        when(userService.changePassword(any(ChangePasswordRequest.class)))
                .thenReturn("Đổi mật khẩu thành công!");

        String payload = """
                {
                  "email": "user@gmail.com",
                  "currentPassword": "oldPassword",
                  "newPassword": "newPassword123"
                }
                """;

        mockMvc.perform(put("/api/user/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(new MediaType("text", "plain", StandardCharsets.UTF_8))
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().string("Đổi mật khẩu thành công!"));
    }

    @Test
    @DisplayName("PUT /api/user/password returns 400 when current password is wrong")
    void changePassword_wrongCurrentPassword_returnsBadRequest() throws Exception {
        when(userService.changePassword(any(ChangePasswordRequest.class)))
                .thenThrow(new AuthException("Mật khẩu hiện tại không chính xác"));

        String payload = """
                {
                  "email": "user@gmail.com",
                  "currentPassword": "wrong",
                  "newPassword": "newPassword123"
                }
                """;

        mockMvc.perform(put("/api/user/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Mật khẩu hiện tại không chính xác"));
    }
}
