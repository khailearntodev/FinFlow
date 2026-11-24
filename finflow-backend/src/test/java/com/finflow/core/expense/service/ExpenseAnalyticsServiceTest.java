package com.finflow.core.expense.service;

import com.finflow.core.audit.service.AuditService;
import com.finflow.core.enums.ExpenseCategory;
import com.finflow.core.expense.dto.ExpenseAnalyticsResponse;
import com.finflow.core.expense.repository.ExpenseParticipantRepository;
import com.finflow.core.expense.repository.ExpenseRepository;
import com.finflow.core.family.domain.Family;
import com.finflow.core.family.repository.FamilyRepository;
import com.finflow.core.family.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseAnalyticsServiceTest {

    @Mock
    private ExpenseParticipantRepository expenseParticipantRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private FamilyRepository familyRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private ExpenseService expenseService;

    @Test
    @DisplayName("getAnalytics fills 6 continuous months, merges null categories to OTHER, and computes WARNING budget")
    void getAnalytics_withBudgetAndNullCategory_returnsAccurateMetrics() {
        UUID familyId = UUID.randomUUID();
        YearMonth now = YearMonth.now(ZoneId.of("Asia/Ho_Chi_Minh"));

        Family family = Family.builder()
                .id(familyId)
                .name("A2.302")
                .billingDate(10)
                .monthlyBudget(new BigDecimal("1000000"))
                .build();

        when(familyRepository.findById(familyId)).thenReturn(Optional.of(family));
        when(expenseRepository.sumMonthlySpending(eq(familyId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(new Object[]{now.getYear(), now.getMonthValue(), new BigDecimal("850000")}));
        when(expenseRepository.sumByCategoryForPeriod(eq(familyId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(
                        new Object[]{ExpenseCategory.FOOD_GROCERIES, new BigDecimal("600000")},
                        new Object[]{null, new BigDecimal("250000")}
                ));

        ExpenseAnalyticsResponse analytics = expenseService.getAnalytics(familyId, 6);

        assertThat(analytics.getMonthlyTrend()).hasSize(6);
        assertThat(analytics.getCurrentMonthTotal()).isEqualByComparingTo("850000");
        assertThat(analytics.getBudgetUsagePercent()).isEqualTo(85.0);
        assertThat(analytics.getBudgetStatus()).isEqualTo("WARNING");
        assertThat(analytics.getCategoryBreakdown()).hasSize(2);
        assertThat(analytics.getCategoryBreakdown().get(0).getCategory()).isEqualTo(ExpenseCategory.FOOD_GROCERIES);
        assertThat(analytics.getCategoryBreakdown().get(1).getCategory()).isEqualTo(ExpenseCategory.OTHER);
    }

    @Test
    @DisplayName("getAnalytics returns EXCEEDED when spending surpasses monthlyBudget")
    void getAnalytics_overBudget_returnsExceededStatus() {
        UUID familyId = UUID.randomUUID();
        YearMonth now = YearMonth.now(ZoneId.of("Asia/Ho_Chi_Minh"));

        Family family = Family.builder()
                .id(familyId)
                .name("A2.302")
                .billingDate(10)
                .monthlyBudget(new BigDecimal("500000"))
                .build();

        when(familyRepository.findById(familyId)).thenReturn(Optional.of(family));
        when(expenseRepository.sumMonthlySpending(eq(familyId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(new Object[]{now.getYear(), now.getMonthValue(), new BigDecimal("650000")}));
        when(expenseRepository.sumByCategoryForPeriod(eq(familyId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());

        ExpenseAnalyticsResponse analytics = expenseService.getAnalytics(familyId, 6);

        assertThat(analytics.getBudgetStatus()).isEqualTo("EXCEEDED");
        assertThat(analytics.getBudgetUsagePercent()).isEqualTo(130.0);
    }
}
