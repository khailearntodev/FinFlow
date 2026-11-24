package com.finflow.core.auth.controller;

import com.finflow.core.auth.dto.AuthResponse;
import com.finflow.core.auth.dto.LoginRequest;
import com.finflow.core.auth.dto.RegisterRequest;
import com.finflow.core.auth.service.AuthService;
import com.finflow.core.exception.AuthException;
import com.finflow.core.exception.GlobalExceptionHandler;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/auth/register returns 200 with JWT token on valid request")
    void register_validRequest_returnsAuthResponse() throws Exception {
        AuthResponse response = AuthResponse.builder()
                .token("jwt-test-token")
                .fullName("Nguyễn Văn A")
                .email("nguyenvana@gmail.com")
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        String payload = """
                {
                  "email": "nguyenvana@gmail.com",
                  "password": "password123",
                  "fullName": "Nguyễn Văn A",
                  "phoneNumber": "0912345678"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-test-token"))
                .andExpect(jsonPath("$.fullName").value("Nguyễn Văn A"))
                .andExpect(jsonPath("$.email").value("nguyenvana@gmail.com"));

        verify(authService).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/register returns 400 when email or phone is invalid")
    void register_invalidPayload_returnsBadRequest() throws Exception {
        String invalidPayload = """
                {
                  "email": "not-an-email",
                  "password": "password123",
                  "fullName": "Nguyễn Văn A",
                  "phoneNumber": "123"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().is5xxServerError());
    }

    @Test
    @DisplayName("POST /api/auth/register returns 400 when email already exists")
    void register_duplicateEmail_returnsBadRequest() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new AuthException("Email đã tồn tại"));

        String payload = """
                {
                  "email": "existing@gmail.com",
                  "password": "password123",
                  "fullName": "Existing User",
                  "phoneNumber": "0912345678"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email đã tồn tại"));
    }

    @Test
    @DisplayName("POST /api/auth/login returns 200 with JWT token on valid credentials")
    void login_validCredentials_returnsAuthResponse() throws Exception {
        AuthResponse response = AuthResponse.builder()
                .token("jwt-login-token")
                .fullName("Nguyễn Văn A")
                .email("nguyenvana@gmail.com")
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        String payload = """
                {
                  "email": "nguyenvana@gmail.com",
                  "password": "password123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-login-token"))
                .andExpect(jsonPath("$.email").value("nguyenvana@gmail.com"));

        verify(authService).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/login returns 400 on wrong password")
    void login_invalidCredentials_returnsBadRequest() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new AuthException("Sai email hoặc mật khẩu"));

        String payload = """
                {
                  "email": "nguyenvana@gmail.com",
                  "password": "wrong-password"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Sai email hoặc mật khẩu"));
    }
}
