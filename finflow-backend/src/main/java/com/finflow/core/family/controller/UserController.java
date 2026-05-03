package com.finflow.core.family.controller;

import com.finflow.core.exception.FamilyException;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.dto.UserProfileResponse;
import com.finflow.core.family.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getProfile(@RequestParam("email") String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new FamilyException("Không tìm thấy người dùng"));

        UserProfileResponse.FamilyDetail familyDetail = null;
        if (user.getFamily() != null) {
            familyDetail = UserProfileResponse.FamilyDetail.builder()
                    .id(user.getFamily().getId())
                    .name(user.getFamily().getName())
                    .billingDate(user.getFamily().getBillingDate())
                    .members(user.getFamily().getMembers().stream()
                            .map(m -> UserProfileResponse.MemberDetail.builder()
                                    .id(m.getId())
                                    .fullName(m.getFullName())
                                    .email(m.getEmail())
                                    .role(m.getRole())
                                    .build())
                            .collect(Collectors.toList()))
                    .build();
        }

        return ResponseEntity.ok(UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .family(familyDetail)
                .build());
    }
}
