package com.finflow.core.auth.service;
import com.finflow.core.auth.dto.AuthResponse;
import com.finflow.core.auth.dto.LoginRequest;
import com.finflow.core.auth.dto.RegisterRequest;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.finflow.core.enums.RoleEnum;
import com.finflow.core.exception.AuthException;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse register(RegisterRequest registerRequest) {
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Xài i meo khác đi");
        }

        User newUser = User.builder()
                .fullName(registerRequest.getFullName())
                .email(registerRequest.getEmail())
                .phoneNumber(registerRequest.getPhoneNumber())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(RoleEnum.USER)
                .build();

        userRepository.save(newUser);
        return AuthResponse.builder()
                .token("tao-sau-i")
                .email(newUser.getEmail())
                .fullName(newUser.getFullName())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail()).orElseThrow(() -> new AuthException("Hong có tài khoản, tạo trước đi ròi đăng nhập"));
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                throw new AuthException("Sai mật khẩu hay gì ròi");
            }
        return AuthResponse.builder()
                .token("tao-sau-i")
                .email(user.getEmail())
                .fullName(user.getFullName())
                .build();
    }
}
