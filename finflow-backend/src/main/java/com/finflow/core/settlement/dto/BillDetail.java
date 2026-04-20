package com.finflow.core.settlement.dto;

import com.finflow.core.enums.SettlementBillStatusEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillDetail {
    private String userEmail;
    private String fullName;
    private BigDecimal amount;
    private SettlementBillStatusEnum status;
}
