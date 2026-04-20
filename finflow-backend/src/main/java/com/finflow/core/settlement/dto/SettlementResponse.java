package com.finflow.core.settlement.dto;

import com.finflow.core.enums.SettlementStatusEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementResponse {
    private String settlementId;
    private Integer month;
    private Integer year;
    private SettlementStatusEnum status;
    private ZonedDateTime createdAt;

    private List<BillDetail> bills;
}
