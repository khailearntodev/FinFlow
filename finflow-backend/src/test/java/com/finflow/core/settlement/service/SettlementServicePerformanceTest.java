package com.finflow.core.settlement.service;

import com.finflow.core.enums.RoleEnum;
import com.finflow.core.enums.SettlementBillStatusEnum;
import com.finflow.core.enums.SettlementStatusEnum;
import com.finflow.core.expense.repository.ExpenseRepository;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.repository.FamilyRepository;
import com.finflow.core.family.repository.UserRepository;
import com.finflow.core.notification.service.EmailService;
import com.finflow.core.settlement.domain.Settlement;
import com.finflow.core.settlement.domain.SettlementBill;
import com.finflow.core.settlement.dto.BillDetail;
import com.finflow.core.settlement.dto.SettlementResponse;
import com.finflow.core.settlement.repository.SettlementBillRepository;
import com.finflow.core.settlement.repository.SettlementRepository;
import com.finflow.core.storage.service.StorageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SettlementServicePerformanceTest {

    @Mock
    private SettlementRepository settlementRepository;
    @Mock
    private SettlementBillRepository settlementBillRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FamilyRepository familyRepository;
    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private StorageService storageService;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private SettlementService settlementService;

    @Test
    @DisplayName("getSettlementsByFamilyId fetches members directly without extra family query")
    void getSettlementsByFamilyId_usesSingleMemberQuery() {
        UUID familyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        User member = User.builder()
                .id(userId)
                .fullName("Nguyễn Quang Khải")
                .email("khainq205@gmail.com")
                .role(RoleEnum.USER)
                .build();

        Settlement settlement = Settlement.builder()
                .id(UUID.randomUUID())
                .familyId(familyId)
                .month(10)
                .year(2026)
                .status(SettlementStatusEnum.PENDING)
                .createdAt(ZonedDateTime.now())
                .build();

        SettlementBill bill = SettlementBill.builder()
                .id(UUID.randomUUID())
                .settlement(settlement)
                .userId(userId)
                .amount(new BigDecimal("485983"))
                .status(SettlementBillStatusEnum.COMPLETED)
                .build();
        settlement.setSettlementBills(List.of(bill));

        when(settlementRepository.findByFamilyId(familyId)).thenReturn(List.of(settlement));
        when(userRepository.findByFamilyId(familyId)).thenReturn(List.of(member));

        List<SettlementResponse> responses = settlementService.getSettlementsByFamilyId(familyId);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getBills()).hasSize(1);
        assertThat(responses.get(0).getBills().get(0).getFullName()).isEqualTo("Nguyễn Quang Khải");
        verify(settlementRepository).findByFamilyId(familyId);
        verify(userRepository).findByFamilyId(familyId);
        verifyNoInteractions(familyRepository);
    }

    @Test
    @DisplayName("getBillsByUserId maps settlement month/year cleanly from eagerly fetched settlement")
    void getBillsByUserId_mapsSettlementFields() {
        UUID userId = UUID.randomUUID();
        User member = User.builder()
                .id(userId)
                .fullName("Nguyễn Quang Khải")
                .email("khainq205@gmail.com")
                .role(RoleEnum.USER)
                .build();

        Settlement settlement = Settlement.builder()
                .id(UUID.randomUUID())
                .month(10)
                .year(2026)
                .status(SettlementStatusEnum.PENDING)
                .build();

        SettlementBill bill = SettlementBill.builder()
                .id(UUID.randomUUID())
                .settlement(settlement)
                .userId(userId)
                .amount(new BigDecimal("485983"))
                .status(SettlementBillStatusEnum.PENDING)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(member));
        when(settlementBillRepository.findByUserId(userId)).thenReturn(List.of(bill));

        List<BillDetail> result = settlementService.getBillsByUserId(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getMonth()).isEqualTo(10);
        assertThat(result.get(0).getYear()).isEqualTo(2026);
        assertThat(result.get(0).getFullName()).isEqualTo("Nguyễn Quang Khải");
    }
}
