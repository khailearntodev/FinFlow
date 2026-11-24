package com.finflow.core.settlement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillBreakdownResponse {
    private UUID billId;
    private UUID settlementId;
    private Integer month;
    private Integer year;
    private String memberFullName;
    private String memberEmail;
    private BigDecimal totalPaid;
    private BigDecimal totalOwed;
    private BigDecimal netAmount;
    private List<BreakdownItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BreakdownItem {
        private UUID expenseId;
        private String title;
        private LocalDate expenseDate;
        private BigDecimal totalExpenseAmount;
        private String paidByName;
        private int participantCount;
        private BigDecimal myPaidAmount;
        private BigDecimal myShareAmount;
        private BigDecimal netImpact;
    }
}
