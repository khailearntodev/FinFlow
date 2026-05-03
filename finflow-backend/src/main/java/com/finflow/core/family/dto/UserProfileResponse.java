package com.finflow.core.family.dto;

import com.finflow.core.enums.RoleEnum;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class UserProfileResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private RoleEnum role;
    private FamilyDetail family;

    @Data
    @Builder
    public static class FamilyDetail {
        private UUID id;
        private String name;
        private Integer billingDate;
        private List<MemberDetail> members;
    }

    @Data
    @Builder
    public static class MemberDetail {
        private UUID id;
        private String fullName;
        private String email;
        private RoleEnum role;
    }
}
