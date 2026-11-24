package com.finflow.core.family.dto;

import com.finflow.core.enums.RoleEnum;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
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
    private String bankCode;
    private String bankAccountNumber;
    private String bankAccountName;
    private ZonedDateTime createdAt;
    private FamilyDetail family;

    @Data
    @Builder
    public static class FamilyDetail {
        private UUID id;
        private String name;
        private Integer billingDate;
        private BigDecimal monthlyBudget;
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
