package com.finflow.core.family.service;

import com.finflow.core.enums.RoleEnum;
import com.finflow.core.exception.AuthException;
import com.finflow.core.exception.FamilyException;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.dto.ChangePasswordRequest;
import com.finflow.core.family.dto.UpdateProfileRequest;
import com.finflow.core.family.dto.UserProfileResponse;
import com.finflow.core.family.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("updateProfile normalizes bank fields and saves user")
    void updateProfile_validBankInfo_savesNormalizedFields() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .fullName("Old Name")
                .email("user@gmail.com")
                .phoneNumber("0912345678")
                .role(RoleEnum.HEAD)
                .build();

        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(user));
        when(userRepository.existsByPhoneNumberAndIdNot("0987654321", userId)).thenReturn(false);

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .email("user@gmail.com")
                .fullName("  Nguyễn Văn Mới  ")
                .phoneNumber("0987654321")
                .bankCode(" mb ")
                .bankAccountNumber(" 1234 5678 90 ")
                .bankAccountName(" nguyen van moi ")
                .build();

        UserProfileResponse response = userService.updateProfile(request);

        assertThat(response.getFullName()).isEqualTo("Nguyễn Văn Mới");
        assertThat(response.getBankCode()).isEqualTo("MB");
        assertThat(response.getBankAccountNumber()).isEqualTo("1234567890");
        assertThat(response.getBankAccountName()).isEqualTo("NGUYEN VAN MOI");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("updateProfile throws FamilyException when phone number belongs to another user")
    void updateProfile_duplicatePhone_throwsException() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email("user@gmail.com").phoneNumber("0912345678").build();

        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(user));
        when(userRepository.existsByPhoneNumberAndIdNot("0999888777", userId)).thenReturn(true);

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .email("user@gmail.com")
                .fullName("Test")
                .phoneNumber("0999888777")
                .build();

        assertThatThrownBy(() -> userService.updateProfile(request))
                .isInstanceOf(FamilyException.class)
                .hasMessageContaining("Số điện thoại này có người xài ròi");
    }

    @Test
    @DisplayName("updateProfile throws FamilyException when bankAccountNumber is set without bankCode")
    void updateProfile_incompleteBankInfo_throwsException() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email("user@gmail.com").phoneNumber("0912345678").build();

        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(user));
        when(userRepository.existsByPhoneNumberAndIdNot("0912345678", userId)).thenReturn(false);

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .email("user@gmail.com")
                .fullName("Test")
                .phoneNumber("0912345678")
                .bankCode("")
                .bankAccountNumber("1234567890")
                .build();

        assertThatThrownBy(() -> userService.updateProfile(request))
                .isInstanceOf(FamilyException.class)
                .hasMessageContaining("ngân hàng với số tài khoản");
    }

    @Test
    @DisplayName("changePassword encodes and saves new password when current matches")
    void changePassword_valid_encodesAndSaves() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user@gmail.com")
                .password("hashed-old")
                .build();

        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("oldPass", "hashed-old")).thenReturn(true);
        when(passwordEncoder.matches("newPass123", "hashed-old")).thenReturn(false);
        when(passwordEncoder.encode("newPass123")).thenReturn("hashed-new");

        String result = userService.changePassword(ChangePasswordRequest.builder()
                .email("user@gmail.com")
                .currentPassword("oldPass")
                .newPassword("newPass123")
                .build());

        assertThat(result).contains("thành công");
        assertThat(user.getPassword()).isEqualTo("hashed-new");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("changePassword throws AuthException when current password does not match")
    void changePassword_wrongCurrent_throwsAuthException() {
        User user = User.builder().id(UUID.randomUUID()).email("user@gmail.com").password("hashed-old").build();
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed-old")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword(ChangePasswordRequest.builder()
                .email("user@gmail.com")
                .currentPassword("wrong")
                .newPassword("newPass123")
                .build()))
                .isInstanceOf(AuthException.class)
                .hasMessageContaining("Sai mật khẩu hiện tại");
    }
}
