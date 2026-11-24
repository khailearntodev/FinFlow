package com.finflow.core.family.service;

import com.finflow.core.exception.AuthException;
import com.finflow.core.exception.FamilyException;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.dto.ChangePasswordRequest;
import com.finflow.core.family.dto.UpdateProfileRequest;
import com.finflow.core.family.dto.UserProfileResponse;
import com.finflow.core.family.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new FamilyException("Hong tìm thấy tài khoản này đâu ròi!"));
        return toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(UpdateProfileRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new FamilyException("Hong tìm thấy tài khoản này đâu ròi!"));

        String normalizedPhone = request.getPhoneNumber().trim();
        if (userRepository.existsByPhoneNumberAndIdNot(normalizedPhone, user.getId())) {
            throw new FamilyException("Số điện thoại này có người xài ròi, đổi số khác nha!");
        }

        String bankCode = trimToNull(request.getBankCode());
        String bankAccountNumber = trimToNull(request.getBankAccountNumber());
        String bankAccountName = trimToNull(request.getBankAccountName());

        boolean hasAnyBankField = bankCode != null || bankAccountNumber != null || bankAccountName != null;
        if (hasAnyBankField && (bankCode == null || bankAccountNumber == null)) {
            throw new FamilyException("Nhập đủ ngân hàng với số tài khoản mới tạo được mã VietQR ok nha!");
        }

        user.setFullName(request.getFullName().trim());
        user.setPhoneNumber(normalizedPhone);
        user.setBankCode(bankCode != null ? bankCode.toUpperCase() : null);
        user.setBankAccountNumber(bankAccountNumber != null ? bankAccountNumber.replaceAll("\\s+", "") : null);
        user.setBankAccountName(bankAccountName != null ? bankAccountName.toUpperCase() : null);

        userRepository.save(user);
        return toProfileResponse(user);
    }

    @Transactional
    public String changePassword(ChangePasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthException("Hong thấy tài khoản của bạn đâu ròi!"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AuthException("Sai mật khẩu hiện tại hay gì ròi, nhập lại nha!");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new AuthException("Bịp nha, mật khẩu mới giống hệt mật khẩu cũ ròi!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return "Đổi mật khẩu thành công!";
    }

    private UserProfileResponse toProfileResponse(User user) {
        UserProfileResponse.FamilyDetail familyDetail = null;
        if (user.getFamily() != null) {
            var members = user.getFamily().getMembers() != null
                    ? user.getFamily().getMembers()
                    : Collections.<User>emptyList();
            familyDetail = UserProfileResponse.FamilyDetail.builder()
                    .id(user.getFamily().getId())
                    .name(user.getFamily().getName())
                    .billingDate(user.getFamily().getBillingDate())
                    .monthlyBudget(user.getFamily().getMonthlyBudget())
                    .members(members.stream()
                            .map(m -> UserProfileResponse.MemberDetail.builder()
                                    .id(m.getId())
                                    .fullName(m.getFullName())
                                    .email(m.getEmail())
                                    .role(m.getRole())
                                    .build())
                            .collect(Collectors.toList()))
                    .build();
        }

        return UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .bankCode(user.getBankCode())
                .bankAccountNumber(user.getBankAccountNumber())
                .bankAccountName(user.getBankAccountName())
                .createdAt(user.getCreatedAt())
                .family(familyDetail)
                .build();
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
