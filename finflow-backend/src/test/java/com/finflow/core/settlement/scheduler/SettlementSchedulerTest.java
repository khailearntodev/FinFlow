package com.finflow.core.settlement.scheduler;

import com.finflow.core.enums.RoleEnum;
import com.finflow.core.family.domain.Family;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.repository.FamilyRepository;
import com.finflow.core.notification.service.EmailService;
import com.finflow.core.settlement.domain.Settlement;
import com.finflow.core.settlement.dto.SettlementCreateRequest;
import com.finflow.core.settlement.repository.SettlementRepository;
import com.finflow.core.settlement.service.SettlementService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SettlementSchedulerTest {

    @Mock
    private FamilyRepository familyRepository;
    @Mock
    private SettlementRepository settlementRepository;
    @Mock
    private SettlementService settlementService;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private SettlementScheduler settlementScheduler;

    @Test
    @DisplayName("runAutoCreateSettlement creates settlement for previous month on billing date")
    void runAutoCreateSettlement_onBillingDate_triggersSettlementForPreviousMonth() {
        UUID familyId = UUID.randomUUID();
        User head = User.builder()
                .id(UUID.randomUUID())
                .fullName("Phạm Công Đạt")
                .email("head@gmail.com")
                .role(RoleEnum.HEAD)
                .build();
        Family family = Family.builder()
                .id(familyId)
                .name("A2.302 - CHƯƠNG DƯƠNG HOME")
                .billingDate(10)
                .members(List.of(head))
                .build();

        when(familyRepository.findByBillingDate(10)).thenReturn(List.of(family));

        settlementScheduler.runAutoCreateSettlement(LocalDate.of(2026, 11, 10));

        ArgumentCaptor<SettlementCreateRequest> captor = ArgumentCaptor.forClass(SettlementCreateRequest.class);
        verify(settlementService).createSettlement(captor.capture());

        SettlementCreateRequest req = captor.getValue();
        assertThat(req.getFamilyId()).isEqualTo(familyId.toString());
        assertThat(req.getHoldEmail()).isEqualTo("head@gmail.com");
        assertThat(req.getMonth()).isEqualTo(10);
        assertThat(req.getYear()).isEqualTo(2026);
    }

    @Test
    @DisplayName("runPreSettlementReminder sends email to family head 1 day 12 hours before billing date")
    void runPreSettlementReminder_36HoursBeforeBillingDate_emailsHead() {
        UUID familyId = UUID.randomUUID();
        User head = User.builder()
                .id(UUID.randomUUID())
                .fullName("Phạm Công Đạt")
                .email("head@gmail.com")
                .role(RoleEnum.HEAD)
                .build();
        Family family = Family.builder()
                .id(familyId)
                .name("A2.302")
                .billingDate(10)
                .members(List.of(head))
                .build();

        // 12:00 on Nov 8 is exactly 1 day 12 hours before 00:00 on Nov 10
        when(familyRepository.findByBillingDate(10)).thenReturn(List.of(family));
        when(settlementRepository.findByFamilyIdAndMonthAndYear(familyId, 10, 2026)).thenReturn(Optional.empty());

        settlementScheduler.runPreSettlementReminder(LocalDate.of(2026, 11, 8));

        verify(emailService).sendEmail(
                eq("head@gmail.com"),
                contains("tháng 10/2026"),
                contains("00:00 ngày 10/11/2026")
        );
    }

    @Test
    @DisplayName("runPreSettlementReminder skips sending email if period is already settled")
    void runPreSettlementReminder_alreadySettled_skipsEmail() {
        UUID familyId = UUID.randomUUID();
        User head = User.builder()
                .id(UUID.randomUUID())
                .fullName("Phạm Công Đạt")
                .email("head@gmail.com")
                .role(RoleEnum.HEAD)
                .build();
        Family family = Family.builder()
                .id(familyId)
                .name("A2.302")
                .billingDate(10)
                .members(List.of(head))
                .build();

        when(familyRepository.findByBillingDate(10)).thenReturn(List.of(family));
        when(settlementRepository.findByFamilyIdAndMonthAndYear(familyId, 10, 2026))
                .thenReturn(Optional.of(new Settlement()));

        settlementScheduler.runPreSettlementReminder(LocalDate.of(2026, 11, 8));

        verifyNoInteractions(emailService);
    }

    @Test
    @DisplayName("runPreSettlementReminder handles month boundary correctly (billingDate = 1)")
    void runPreSettlementReminder_monthBoundary_calculatesCorrectPeriod() {
        UUID familyId = UUID.randomUUID();
        User head = User.builder()
                .id(UUID.randomUUID())
                .fullName("Chủ Hộ")
                .email("head@gmail.com")
                .role(RoleEnum.HEAD)
                .build();
        Family family = Family.builder()
                .id(familyId)
                .name("Gia đình Test")
                .billingDate(1)
                .members(List.of(head))
                .build();

        // 12:00 on Nov 29 + 36h = 00:00 on Dec 1 -> settles November 2026
        when(familyRepository.findByBillingDate(1)).thenReturn(List.of(family));
        when(settlementRepository.findByFamilyIdAndMonthAndYear(familyId, 11, 2026)).thenReturn(Optional.empty());

        settlementScheduler.runPreSettlementReminder(LocalDate.of(2026, 11, 29));

        verify(emailService).sendEmail(
                eq("head@gmail.com"),
                contains("tháng 11/2026"),
                contains("00:00 ngày 01/12/2026")
        );
    }
}
