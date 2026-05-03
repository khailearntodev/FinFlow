package com.finflow.core.settlement.service;

import com.finflow.core.enums.ExpenseStatus;
import com.finflow.core.enums.RoleEnum;
import com.finflow.core.enums.SettlementBillStatusEnum;
import com.finflow.core.enums.SettlementStatusEnum;
import com.finflow.core.exception.ExpenseException;
import com.finflow.core.exception.SettlementException;
import com.finflow.core.exception.StorageException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
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
import com.finflow.core.storage.service.StorageService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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

    private final StorageService storageService;

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

        List<Expense> pendingExpenses = expenseRepository.findByFamilyId(family.getId())
                .stream()
                .filter(e -> e.getStatus() == ExpenseStatus.PENDING)
                .filter(e -> {
                    // Chốt sổ cho tháng T, năm Y sẽ bao gồm các khoản chi từ tháng T trở về trước
                    if (e.getExpenseDate().getYear() < settlementCreateRequest.getYear()) return true;
                    if (e.getExpenseDate().getYear() == settlementCreateRequest.getYear()) {
                        return e.getExpenseDate().getMonthValue() <= settlementCreateRequest.getMonth();
                    }
                    return false;
                })
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

            //4. Phân bổ tiền
            boolean remainderAssigned = false;
            for (ExpenseParticipant participant: expense.getParticipants()) {
                UUID pID = participant.getId().getUserId();
                BigDecimal amountToOwe = shareAmount;
                if (!remainderAssigned && remainder.compareTo(BigDecimal.ZERO) != 0) {
                    amountToOwe = amountToOwe.add(remainder);
                    remainderAssigned = true;
                }
                owedMap.put(pID, owedMap.get(pID).add(amountToOwe));
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

            //tiền cuối cùng = số phải trả (mắc nợ) - số đã chi
            BigDecimal netAmount = owedMap.get(memberId).subtract(paidMap.get(memberId));
            totalVerification = totalVerification.add(netAmount);

            SettlementBill bill = SettlementBill.builder()
                    .settlement(settlement)
                    .userId(memberId)
                    .amount(netAmount)
                    .status(SettlementBillStatusEnum.PENDING)
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

    @Transactional
    public String submitPaymentProof(UUID billId, String userEmail, MultipartFile proofFile) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(
                () -> new SettlementException("Không tìm thấy người dùng")
        );

        SettlementBill bill = settlementBillRepository.findById(billId).orElseThrow(
                () -> new SettlementException("Không tìm thấy hóa đơn")
        );

        if (bill.getStatus() != SettlementBillStatusEnum.PENDING) {
            throw new SettlementException("Hóa đơn không hợp lệ, vui lòng chọn đúng hóa đơn tháng này");
        }

        if (user.getFamily() == null || !user.getFamily().getId().equals(bill.getSettlement().getFamilyId())) {
            throw new SettlementException("Hóa đơn phải thuộc về gia đình này");
        }

        if (!user.getId().equals(bill.getUserId())) {
            throw new SettlementException("Bạn chỉ có thể nộp minh chứng cho chính mình");
        }

        String proofUrl = storageService.uploadImage(proofFile);

        bill.setProofImageUrl(proofUrl);
        bill.setStatus(SettlementBillStatusEnum.WAITING_FOR_CONFIRMATION);
        settlementBillRepository.save(bill);

        return "Nộp minh chứng thành công! Đang đợi chủ hộ xác nhận!";
    }

    @Transactional
    public String confirmPayment(UUID billId, String headEmail) {
        User head = userRepository.findByEmail(headEmail).orElseThrow(
                () -> new SettlementException("Không tìm thấy chủ hộ")
        );

        SettlementBill bill = settlementBillRepository.findById(billId).orElseThrow(
                () -> new SettlementException("Không tìm thấy hóa đơn!")
        );

        Settlement settlement = bill.getSettlement();

        if (head.getRole() != RoleEnum.HEAD || !head.getFamily().getId().equals(bill.getSettlement().getFamilyId())) {
            throw new SettlementException("Chỉ có chủ hộ mới có quyền xác nhận thanh toán");
        }

        if (bill.getStatus() == SettlementBillStatusEnum.COMPLETED) {
            throw new SettlementException("Hóa đơn này đã được xác nhận trước đó");
        }

        if (bill.getStatus() == SettlementBillStatusEnum.PENDING && bill.getAmount().compareTo(BigDecimal.ZERO) >= 0) {
            throw new SettlementException("Hóa đơn này chưa được nộp minh chứng thanh toán");
        }

        bill.setStatus(SettlementBillStatusEnum.COMPLETED);
        settlementBillRepository.save(bill);

        boolean isAllCompleted = settlement.getSettlementBills().stream()
                .allMatch(b -> b.getStatus() == SettlementBillStatusEnum.COMPLETED);
        if (isAllCompleted) {
            settlement.setStatus(SettlementStatusEnum.COMPLETED);
            settlementRepository.save(settlement);
        }
        return "Xác nhận thanh toán thành công!";
    }

    @Transactional
    public List<SettlementResponse> getSettlementsByFamilyId(UUID familyId) {
        return settlementRepository.findByFamilyId(familyId).stream()
                .map(s -> SettlementResponse.builder()
                        .settlementId(s.getId().toString())
                        .month(s.getMonth())
                        .year(s.getYear())
                        .status(s.getStatus())
                        .createdAt(s.getCreatedAt())
                        .bills(s.getSettlementBills().stream()
                                .map(b -> {
                                    User user = userRepository.findById(b.getUserId()).orElse(null);
                                    return BillDetail.builder()
                                            .id(b.getId())
                                            .userEmail(user != null ? user.getEmail() : "N/A")
                                            .fullName(user != null ? user.getFullName() : "N/A")
                                            .amount(b.getAmount())
                                            .status(b.getStatus())
                                            .proofImageUrl(b.getProofImageUrl())
                                            .build();
                                })
                                .toList())
                        .build())
                .toList();
    }

    @Transactional
    public List<BillDetail> getBillsByUserId(UUID userId) {
        return settlementBillRepository.findByUserId(userId).stream()
                .map(b -> {
                    User user = userRepository.findById(b.getUserId()).orElse(null);
                    return BillDetail.builder()
                            .id(b.getId())
                            .userEmail(user != null ? user.getEmail() : "N/A")
                            .fullName(user != null ? user.getFullName() : "N/A")
                            .amount(b.getAmount())
                            .status(b.getStatus())
                            .proofImageUrl(b.getProofImageUrl())
                            .month(b.getSettlement().getMonth())
                            .year(b.getSettlement().getYear())
                            .build();
                })
                .toList();
    }
    @Transactional
    public String cancelSettlement(UUID settlementId, String headEmail) {
        User head = userRepository.findByEmail(headEmail).orElseThrow(
                () -> new SettlementException("Không tìm thấy chủ hộ")
        );

        Settlement settlement = settlementRepository.findById(settlementId).orElseThrow(
                () -> new SettlementException("Không tìm thấy kỳ chốt sổ")
        );

        if (head.getRole() != RoleEnum.HEAD || !head.getFamily().getId().equals(settlement.getFamilyId())) {
            throw new SettlementException("Chỉ có chủ hộ mới có quyền hủy chốt sổ");
        }

        boolean hasPayments = settlement.getSettlementBills().stream()
                .anyMatch(b -> b.getStatus() != SettlementBillStatusEnum.PENDING);
        
        if (hasPayments) {
            throw new SettlementException("Không thể hủy kỳ chốt sổ khi đã có thành viên thực hiện thanh toán!");
        }

        // 1. Mở khóa chi tiêu
        List<Expense> expenses = expenseRepository.findAll(); // Optimization: filter by settlementId in repo
        expenses.stream()
                .filter(e -> settlementId.equals(e.getSettlementId()))
                .forEach(e -> {
                    e.setStatus(ExpenseStatus.PENDING);
                    e.setSettlementId(null);
                });
        expenseRepository.saveAll(expenses);

        // 2. Xóa bills và settlement
        settlementBillRepository.deleteAll(settlement.getSettlementBills());
        settlementRepository.delete(settlement);

        return "Hủy kỳ chốt sổ thành công! Dữ liệu đã được mở khóa.";
    }
}
