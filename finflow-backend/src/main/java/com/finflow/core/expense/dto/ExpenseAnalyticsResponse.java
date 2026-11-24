package com.finflow.core.expense.dto;

import com.finflow.core.enums.ExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseAnalyticsResponse {
    private BigDecimal currentMonthTotal;
    private BigDecimal monthlyBudget;
    private Double budgetUsagePercent;
    private String budgetStatus; // NONE, SAFE, WARNING, EXCEEDED
    private List<MonthlyPoint> monthlyTrend;
    private List<CategorySlice> categoryBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyPoint {
        private int year;
        private int month;
        private String label;
        private BigDecimal totalAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategorySlice {
        private ExpenseCategory category;
        private BigDecimal amount;
        private double percentage;
    }
}
