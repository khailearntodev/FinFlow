package com.finflow.core.settlement.service;

import com.finflow.core.enums.ExpenseStatus;
import com.finflow.core.enums.RoleEnum;
import com.finflow.core.enums.SettlementBillStatusEnum;
import com.finflow.core.enums.SettlementStatusEnum;
import com.finflow.core.exception.ExpenseException;
import com.finflow.core.exception.SettlementException;
import com.finflow.core.expense.domain.Expense;
import com.finflow.core.expense.domain.ExpenseParticipant;
import com.finflow.core.expense.dto.ExpenseResponse;
import com.finflow.core.expense.repository.ExpenseRepository;
import com.finflow.core.expense.service.ExpenseService;
import com.finflow.core.family.domain.Family;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.repository.FamilyRepository;
import com.finflow.core.family.repository.UserRepository;
import com.finflow.core.settlement.domain.Settlement;
import com.finflow.core.settlement.domain.SettlementBill;
import com.finflow.core.settlement.dto.BillDetail;
import com.finflow.core.settlement.dto.SettlementCreateRequest;
import com.finflow.core.settlement.dto.SettlementResponse;
import com.finflow.core.settlement.repository.SettlementBillRepository;
import com.finflow.core.settlement.repository.SettlementRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SettlementService {
    public final SettlementRepository settlementRepository;
    public final SettlementBillRepository settlementBillRepository;
    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final ExpenseRepository expenseRepository;

    @Transactional
    public SettlementResponse createSettlement(SettlementCreateRequest settlementCreateRequest) {
        User holdFamily = userRepository.findByEmail(settlementCreateRequest.getHoldEmail())
                .orElseThrow(
                        () -> new SettlementException("Không tìm thấy người tạo yêu cầu kết sổ")
                );

        Family family = familyRepository.findById(UUID.fromString(settlementCreateRequest.getFamilyId())).orElseThrow(
                () -> new SettlementException("Không tìm thấy gia đình")
        );

        boolean isFamilyHead = family.getMembers().contains(holdFamily);
        if (!isFamilyHead || holdFamily.getRole() == RoleEnum.USER) {
            throw new ExpenseException("Chỉ chủ hộ của gia đình mới được tạo Kết sổ");
        }

        if (settlementRepository.findByFamilyIdAndMonthAndYear(family.getId(), settlementCreateRequest.getMonth(), settlementCreateRequest.getYear()).isPresent()) {
            throw new SettlementException("Tháng này đã được chốt sổ rồi!");
        }

        List<Expense> pendingExpenses = expenseRepository.findByFamilyId(UUID.fromString(settlementCreateRequest.getFamilyId()))
                .stream()
                .filter(e -> e.getStatus() == ExpenseStatus.PENDING)
                .toList();

        if (pendingExpenses.isEmpty()) {
            throw new SettlementException("Không có khoản chi nào cần kết sổ");
        }

        Map<UUID, BigDecimal> paidMap = new HashMap<UUID,BigDecimal>();
        Map<UUID, BigDecimal> owedMap = new HashMap<UUID,BigDecimal>();

        for (User user: family.getMembers()) {
            paidMap.put(user.getId(), BigDecimal.ZERO);
            owedMap.put(user.getId(), BigDecimal.ZERO);
        }

        for (Expense expense: pendingExpenses) {
            //1. Người nào trả tiền thì cộng vào ví paidMap
            UUID payerId = UUID.fromString(expense.getPaidByUserId());
            paidMap.put(payerId, paidMap.get(payerId).add(expense.getAmount()));

            //2. Chia nợ đều cho những người tham gia (bao gồm người chi trả)
            int participantCount = expense.getParticipants().size();
            BigDecimal shareAmount = expense.getAmount().divide(BigDecimal.valueOf(participantCount), 2, RoundingMode.HALF_UP);

            //3. xử lý tiền lẻ
            BigDecimal totalShared = shareAmount.multiply(BigDecimal.valueOf(participantCount));
            BigDecimal remainder = expense.getAmount().subtract(totalShared);
            paidMap.put(payerId, paidMap.get(payerId).add(totalShared));

            //4. Phân bổ tiền
            for (ExpenseParticipant participant: expense.getParticipants()) {
                UUID pID = participant.getId().getUserId();
                owedMap.put(pID, owedMap.get(pID).add(shareAmount));
            }
        }

        //5. tạo chốt sổ tháng
        Settlement settlement = Settlement.builder()
                .familyId(UUID.fromString(settlementCreateRequest.getFamilyId()))
                .month(settlementCreateRequest.getMonth())
                .year(settlementCreateRequest.getYear())
                .status(SettlementStatusEnum.PENDING)
                .build();

        settlementRepository.save(settlement);

        //6. Tính công nợ cuối cùng
        List<SettlementBill> billsToSave = new ArrayList<>();
        List<BillDetail> billDetails = new ArrayList<>();
        BigDecimal totalVerification = BigDecimal.ZERO;

        for (User member: family.getMembers()) {
            UUID memberId = member.getId();

            //tiền cuối cùng = số đã chi - số phải trả (mắc nợ)
            BigDecimal netAmount = paidMap.get(memberId).subtract(paidMap.get(memberId));
            totalVerification = totalVerification.add(netAmount);

            SettlementBill bill = SettlementBill.builder()
                    .settlement(settlement)
                    .userId(memberId)
                    .amount(netAmount)
                    .status(SettlementStatusEnum.PENDING)
                    .build();

            billsToSave.add(bill);

            billDetails.add(BillDetail.builder()
                    .userEmail(member.getEmail())
                    .fullName(member.getFullName())
                    .amount(netAmount)
                    .status(SettlementBillStatusEnum.PENDING)
                    .build());
        }

        //7. Kiểm tra dòng tiền đúng chưa
        if (totalVerification.compareTo(BigDecimal.ZERO) != 0) {
            throw new SettlementException("Dòng tiền bị thất thoát");
        }

        //8. lưu dữ liệu
        settlementBillRepository.saveAll(billsToSave);
        for (Expense expense: pendingExpenses) {
            expense.setStatus(ExpenseStatus.SETTLED);
            expense.setSettlementId(settlement.getId());
        }
        expenseRepository.saveAll(pendingExpenses);

        //9. trả về cho fe
        return SettlementResponse.builder()
                .settlementId(settlement.getId().toString())
                .month(settlement.getMonth())
                .year(settlement.getYear())
                .status(settlement.getStatus())
                .createdAt(settlement.getCreatedAt())
                .bills(billDetails)
                .build();
    }
}
