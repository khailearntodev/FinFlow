package com.finflow.core.expense.service;

import com.finflow.core.audit.service.AuditService;
import com.finflow.core.enums.AuditEnum;
import com.finflow.core.enums.ExpenseStatus;
import com.finflow.core.enums.RoleEnum;
import com.finflow.core.exception.ExpenseException;
import com.finflow.core.exception.FamilyException;
import com.finflow.core.expense.domain.Expense;
import com.finflow.core.expense.domain.ExpenseParticipant;
import com.finflow.core.expense.dto.ExpenseCreateRequest;
import com.finflow.core.expense.dto.ExpenseResponse;
import com.finflow.core.expense.repository.ExpenseParticipantRepository;
import com.finflow.core.expense.repository.ExpenseRepository;
import com.finflow.core.family.domain.Family;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.repository.FamilyRepository;
import com.finflow.core.family.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.management.relation.Role;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExpenseService {
    public final ExpenseParticipantRepository expenseParticipantRepository;
    public final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final FamilyRepository familyRepository;
    private final AuditService auditService;

    @Transactional
    public String createExpense(ExpenseCreateRequest expenseCreateRequest) {
        User user = userRepository.findByEmail(expenseCreateRequest.getPaidByEmail())
                .orElseThrow(() -> new ExpenseException("Không tìm thấy người chi tiền!"));

        if (user.getFamily() == null) throw new ExpenseException("Người chi tiền phải thuộc về 1 gia đình!");

        List<UUID> familyMemberIds = user.getFamily().getMembers().stream()
                .map(User::getId)
                .toList();

        for (UUID participantId : expenseCreateRequest.getParticipantIDs()) {
            if (!familyMemberIds.contains(participantId)) {
                throw new ExpenseException("Lỗi: Người dùng có ID " + participantId + " không phải là thành viên trong gia đình của bạn!");
            }
        }

        Expense expense = Expense.builder()
                .familyId(user.getFamily().getId())
                .status(ExpenseStatus.PENDING)
                .amount(expenseCreateRequest.getAmount())
                .expenseDate(expenseCreateRequest.getExpenseDate())
                .title(expenseCreateRequest.getTitle())
                .paidByUserId(user.getId().toString())
                .build();

        List<ExpenseParticipant> participants = new ArrayList<>(
                expenseCreateRequest.getParticipantIDs()
                        .stream()
                        .distinct()
                        .map(userId -> new ExpenseParticipant(expense, userId))
                        .toList()
        );

        expense.setParticipants(participants);
        expenseRepository.save(expense);

        auditService.logExpenseChange(
                user.getFamily().getId(),
                user.getId(),
                AuditEnum.CREATE,
                expense.getId(),
                null,
                extractExpenseSnapshot(expense)
        );

        return "Đã ghi nhận khoản chi " + expense.getAmount() + " của " + user.getFullName() + " thành công!";
    }

    @Transactional
    public ExpenseResponse getExpenseById(UUID familyId, UUID expenseId){
        Expense expense = expenseRepository.findById(expenseId).orElseThrow(
                () -> new ExpenseException("Không tìm thấy khoảng chi tiêu " + expenseId)
        );

        Family family = familyRepository.findById(familyId).orElseThrow(
                () -> new ExpenseException("Không tìm thấy gia đình " + familyId)
        );

        if (!family.getId().equals(expense.getFamilyId())) {
            throw new ExpenseException("Chi tiêu không thuộc về gia đình này");
        }

        User payer = userRepository.findById(UUID.fromString(expense.getPaidByUserId())).orElseThrow(
                () -> new ExpenseException("Không tìm thấy người chi trả")
        );

        List<UUID> participantIds = expense.getParticipants().stream()
                .map(u->u.getId().getUserId())
                .toList();

        List<String> participantEmails = userRepository.findAllById(participantIds).stream()
                .map(User::getEmail)
                .toList();

        return ExpenseResponse.builder()
                .id(expense.getId().toString())
                .title(expense.getTitle())
                .amount(expense.getAmount())
                .expenseDate(expense.getExpenseDate())
                .paidByEmail(payer.getEmail())
                .participants(participantEmails)
                .build();
    }

    @Transactional
    public List<ExpenseResponse> getAllExpensesByFamilyId(UUID familyId){
        Family family = familyRepository.findById(familyId).orElseThrow(
                () -> new ExpenseException("Không tìm thấy gia đình " + familyId)
        );

        List<Expense> expenses = expenseRepository.findByFamilyId(familyId);

        return expenses.stream().map(expense -> {

            User payer = userRepository.findById(UUID.fromString(expense.getPaidByUserId()))
                    .orElseThrow(() -> new ExpenseException("Không tìm thấy người chi trả cho khoản: " + expense.getTitle()));

            List<UUID> participantIds = expense.getParticipants().stream()
                    .map(ep -> ep.getId().getUserId())
                    .toList();

            List<String> participantEmails = userRepository.findAllById(participantIds).stream()
                    .map(User::getEmail)
                    .toList();

            return ExpenseResponse.builder()
                    .id(expense.getId().toString())
                    .title(expense.getTitle())
                    .amount(expense.getAmount())
                    .expenseDate(expense.getExpenseDate())
                    .paidByEmail(payer.getEmail())
                    .participants(participantEmails)
                    .status(expense.getStatus())
                    .build();

        }).toList();
    }

    @Transactional
    public void deleteExpense(UUID familyId, UUID expenseId, UUID userId){
        Expense expense = expenseRepository.findById(expenseId).orElseThrow(
                () -> new ExpenseException("Không tìm thấy khoảng chi tiêu " + expenseId)
        );

        User user = userRepository.findById(userId).orElseThrow(
                () -> new ExpenseException("Không tìm thấy người dùng")
        );

        if (expense.getStatus() == ExpenseStatus.SETTLED) {
            throw new ExpenseException("Không được xóa khoản chi đã chốt sổ");
        }

        boolean isNotPayer = !userId.toString().equals(expense.getPaidByUserId());
        boolean isNotHead = user.getRole() != RoleEnum.HEAD;

        if (isNotPayer && isNotHead) {
            throw new ExpenseException("Chỉ người chi trả hoặc chủ hộ mới được xóa khoản chi");
        }

        if (!expense.getFamilyId().equals(familyId)) {
            throw new ExpenseException("Đây không phải khoản chi thuộc về gia đình này");
        }
        Map<String, Object> oldData = extractExpenseSnapshot(expense);

        expenseRepository.delete(expense);

        auditService.logExpenseChange(
                expense.getFamilyId(),
                userId,
                AuditEnum.DELETE,
                expense.getId(),
                oldData,
                null
        );
    }

    @Transactional
    public ExpenseResponse updateExpense(UUID familyId, UUID expenseId, ExpenseCreateRequest expenseCreateRequest, UUID userId){
 
        Expense expense = expenseRepository.findById(expenseId).orElseThrow(
                () -> new ExpenseException("Không tồn tại khoản chi này")
        );
 
        User user = userRepository.findById(userId).orElseThrow(
                () -> new ExpenseException("Không tìm thấy người dùng thực hiện yêu cầu")
        );
 
        if (!expense.getFamilyId().equals(familyId)) {
            throw new ExpenseException("Khoản chi không thuộc về gia đình này");
        }
 
        if (expense.getStatus() == ExpenseStatus.SETTLED) {
            throw new ExpenseException("Khoản chi đã được kết sổ rồi, không thể sửa");
        }
 
        boolean isNotPayer = !userId.toString().equals(expense.getPaidByUserId());
        boolean isNotHead = user.getRole() != RoleEnum.HEAD;
 
        if (isNotPayer && isNotHead) {
            throw new ExpenseException("Chỉ người chi trả hoặc chủ hộ mới được sửa khoản chi");
        }
 
        User payer = userRepository.findByEmail(expenseCreateRequest.getPaidByEmail())
                .orElseThrow(() -> new ExpenseException("Người thanh toán không hợp lệ"));
 
        if (payer.getFamily() == null || !payer.getFamily().getId().equals(familyId)) {
            throw new ExpenseException("Người thanh toán phải là thành viên trong gia đình");
        }

        Map<String, Object> oldData = extractExpenseSnapshot(expense);

        List<UUID> familyMemberIds = payer.getFamily().getMembers().stream()
                .map(User::getId)
                .toList();

        for (UUID participantId : expenseCreateRequest.getParticipantIDs()) {
            if (!familyMemberIds.contains(participantId)) {
                throw new ExpenseException("Người được chia tiền (ID: " + participantId + ") không nằm trong gia đình!");
            }
        }

        expense.setTitle(expenseCreateRequest.getTitle());
        expense.setAmount(expenseCreateRequest.getAmount());
        expense.setExpenseDate(expenseCreateRequest.getExpenseDate());
        expense.setPaidByUserId(payer.getId().toString());

        expense.getParticipants().clear();
        List<ExpenseParticipant> newParticipants = expenseCreateRequest.getParticipantIDs().stream()
                .distinct()
                .map(participantId -> new ExpenseParticipant(expense, participantId))
                .toList();
        expense.getParticipants().addAll(newParticipants);

        expenseRepository.save(expense);

        Map<String, Object> newData = extractExpenseSnapshot(expense);

        auditService.logExpenseChange(
                expense.getFamilyId(),
                payer.getId(),
                AuditEnum.UPDATE,
                expense.getId(),
                oldData,
                newData
        );

        List<String> participantEmails = userRepository.findAllById(expenseCreateRequest.getParticipantIDs())
                .stream().map(User::getEmail).toList();

        return ExpenseResponse.builder()
                .id(expenseId.toString())
                .title(expense.getTitle())
                .amount(expense.getAmount())
                .expenseDate(expense.getExpenseDate())
                .paidByEmail(payer.getEmail())
                .participants(participantEmails)
                .build();
    }

    private Map<String, Object> extractExpenseSnapshot(Expense expense) {
        if (expense == null) return null;

        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("title", expense.getTitle());
        snapshot.put("amount", expense.getAmount());
        snapshot.put("expenseDate", expense.getExpenseDate().toString());
        snapshot.put("paidByUserId", expense.getPaidByUserId());
        snapshot.put("status", expense.getStatus());

        if (expense.getParticipants() != null) {
            List<String> participantIds = expense.getParticipants().stream()
                    .map(p -> p.getId().getUserId().toString())
                    .toList();
            snapshot.put("participants", participantIds);
        }

        return snapshot;
    }
}
