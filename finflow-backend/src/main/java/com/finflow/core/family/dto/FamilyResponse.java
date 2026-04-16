package com.finflow.core.family.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class FamilyResponse {
    private UUID id;
    private String name;
    private Integer billingDate;
    private String message;
}
