package com.finflow.core.family.controller;

import com.finflow.core.enums.RoleEnum;
import com.finflow.core.exception.GlobalExceptionHandler;
import com.finflow.core.family.domain.Family;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/user/me returns profile with family and members")
    void getProfile_withFamily_returnsFullProfile() throws Exception {
        UUID familyId = UUID.randomUUID();
        UUID headId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();

        User head = User.builder()
                .id(headId)
                .fullName("Trần Chủ Hộ")
                .email("head@gmail.com")
                .phoneNumber("0912345678")
                .role(RoleEnum.HEAD)
                .build();

        User member = User.builder()
                .id(memberId)
                .fullName("Trần Thành Viên")
                .email("member@gmail.com")
                .phoneNumber("0987654321")
                .role(RoleEnum.USER)
                .build();

        Family family = Family.builder()
                .id(familyId)
                .name("Gia đình Hạnh Phúc")
                .billingDate(25)
                .members(new ArrayList<>(List.of(member)))
                .build();
        head.setFamily(family);

        when(userRepository.findByEmail("head@gmail.com")).thenReturn(Optional.of(head));

        mockMvc.perform(get("/api/user/me").param("email", "head@gmail.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("head@gmail.com"))
                .andExpect(jsonPath("$.role").value("HEAD"))
                .andExpect(jsonPath("$.family.name").value("Gia đình Hạnh Phúc"))
                .andExpect(jsonPath("$.family.billingDate").value(25))
                .andExpect(jsonPath("$.family.members.length()").value(2));
    }

    @Test
    @DisplayName("GET /api/user/me returns profile without family when user has none")
    void getProfile_withoutFamily_returnsNullFamily() throws Exception {
        User user = User.builder()
                .id(UUID.randomUUID())
                .fullName("Người Dùng Mới")
                .email("newuser@gmail.com")
                .phoneNumber("0901234567")
                .role(RoleEnum.USER)
                .family(null)
                .build();

        when(userRepository.findByEmail("newuser@gmail.com")).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/user/me").param("email", "newuser@gmail.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newuser@gmail.com"))
                .andExpect(jsonPath("$.family").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/user/me returns 400 when user is not found")
    void getProfile_notFound_returnsBadRequest() throws Exception {
        when(userRepository.findByEmail("missing@gmail.com")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/user/me").param("email", "missing@gmail.com"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Không tìm thấy người dùng"));
    }
}
