package com.finflow.core.settlement.service;

import com.finflow.core.enums.RoleEnum;
import com.finflow.core.enums.SettlementBillStatusEnum;
import com.finflow.core.enums.SettlementStatusEnum;
import com.finflow.core.expense.domain.Expense;
import com.finflow.core.expense.domain.ExpenseParticipant;
import com.finflow.core.expense.repository.ExpenseRepository;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.repository.FamilyRepository;
import com.finflow.core.family.repository.UserRepository;
import com.finflow.core.notification.service.EmailService;
import com.finflow.core.settlement.domain.Settlement;
import com.finflow.core.settlement.domain.SettlementBill;
import com.finflow.core.settlement.dto.BillBreakdownResponse;
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
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SettlementBreakdownAndQrTest {

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
    @DisplayName("getSettlementsByFamilyId assigns Head QR to debtor and Member QR to creditor")
    void getSettlementsByFamilyId_assignsCorrectQrRecipients() {
        UUID familyId = UUID.randomUUID();
        UUID headId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();

        User head = User.builder()
                .id(headId).fullName("Chủ Hộ").email("head@gmail.com").role(RoleEnum.HEAD)
                .bankCode("MB").bankAccountNumber("111122223333").bankAccountName("CHU HO")
                .build();
        User member = User.builder()
                .id(memberId).fullName("Thành Viên").email("member@gmail.com").role(RoleEnum.USER)
                .bankCode("VCB").bankAccountNumber("444455556666").bankAccountName("THANH VIEN")
                .build();

        Settlement settlement = Settlement.builder()
                .id(UUID.randomUUID()).familyId(familyId).month(10).year(2026)
                .status(SettlementStatusEnum.PENDING).createdAt(ZonedDateTime.now())
                .build();

        SettlementBill debtorBill = SettlementBill.builder()
                .id(UUID.randomUUID()).settlement(settlement).userId(memberId)
                .amount(new BigDecimal("200000")).status(SettlementBillStatusEnum.PENDING)
                .build();
        SettlementBill creditorBill = SettlementBill.builder()
                .id(UUID.randomUUID()).settlement(settlement).userId(memberId)
                .amount(new BigDecimal("-150000")).status(SettlementBillStatusEnum.PENDING)
                .build();
        settlement.setSettlementBills(List.of(debtorBill, creditorBill));

        when(settlementRepository.findByFamilyId(familyId)).thenReturn(List.of(settlement));
        when(userRepository.findByFamilyId(familyId)).thenReturn(List.of(head, member));

        List<SettlementResponse> result = settlementService.getSettlementsByFamilyId(familyId);
        List<BillDetail> bills = result.get(0).getBills();

        // Debtor pays Head's MB account
        assertThat(bills.get(0).getQrImageUrl()).contains("MB-111122223333-compact2.svg?amount=200000");
        assertThat(bills.get(0).getRecipientBankCode()).isEqualTo("MB");

        // Creditor receives refund to Member's VCB account
        assertThat(bills.get(1).getQrImageUrl()).contains("VCB-444455556666-compact2.svg?amount=150000");
        assertThat(bills.get(1).getRecipientBankCode()).isEqualTo("VCB");
    }

    @Test
    @DisplayName("getBillBreakdown matches totalOwed - totalPaid to exact bill amount including rounding remainder")
    void getBillBreakdown_calculatesExactPaidOwedAndNet() {
        UUID familyId = UUID.randomUUID();
        UUID settlementId = UUID.randomUUID();
        UUID billId = UUID.randomUUID();
        UUID u1 = UUID.randomUUID();
        UUID u2 = UUID.randomUUID();
        UUID u3 = UUID.randomUUID();

        User user1 = User.builder().id(u1).fullName("User 1").email("u1@gmail.com").role(RoleEnum.HEAD).build();
        User user2 = User.builder().id(u2).fullName("User 2").email("u2@gmail.com").role(RoleEnum.USER).build();
        User user3 = User.builder().id(u3).fullName("User 3").email("u3@gmail.com").role(RoleEnum.USER).build();

        Settlement settlement = Settlement.builder()
                .id(settlementId).familyId(familyId).month(10).year(2026)
                .status(SettlementStatusEnum.PENDING).build();

        // Expense: 100,000 paid by u1, split among u1, u2, u3 -> u1 share = 33,333.34 (with 0.01 remainder), paid = 100,000 -> net = -66,666.66
        Expense exp = Expense.builder()
                .id(UUID.randomUUID()).familyId(familyId).settlementId(settlementId)
                .title("Tiền điện").amount(new BigDecimal("100000.00"))
                .expenseDate(LocalDate.of(2026, 10, 20)).paidByUserId(u1.toString())
                .build();
        exp.setParticipants(List.of(
                new ExpenseParticipant(exp, u1),
                new ExpenseParticipant(exp, u2),
                new ExpenseParticipant(exp, u3)
        ));

        SettlementBill bill = SettlementBill.builder()
                .id(billId).settlement(settlement).userId(u1)
                .amount(new BigDecimal("-66666.66")).status(SettlementBillStatusEnum.PENDING)
                .build();

        when(settlementBillRepository.findWithSettlementById(billId)).thenReturn(Optional.of(bill));
        when(expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId)).thenReturn(List.of(exp));
        when(userRepository.findByFamilyId(familyId)).thenReturn(List.of(user1, user2, user3));

        BillBreakdownResponse breakdown = settlementService.getBillBreakdown(billId);

        assertThat(breakdown.getTotalPaid()).isEqualByComparingTo("100000.00");
        assertThat(breakdown.getTotalOwed()).isEqualByComparingTo("33333.34");
        assertThat(breakdown.getTotalOwed().subtract(breakdown.getTotalPaid()))
                .isEqualByComparingTo(breakdown.getNetAmount());
        assertThat(breakdown.getItems()).hasSize(1);
    }
}
