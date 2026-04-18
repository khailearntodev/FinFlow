package com.finflow.core.expense.service;

import com.finflow.core.enums.ExpenseStatus;
import com.finflow.core.exception.ExpenseException;
import com.finflow.core.expense.domain.Expense;
import com.finflow.core.expense.domain.ExpenseParticipant;
import com.finflow.core.expense.dto.ExpenseCreateRequest;
import com.finflow.core.expense.repository.ExpenseParticipantRepository;
import com.finflow.core.expense.repository.ExpenseRepository;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.repository.FamilyRepository;
import com.finflow.core.family.repository.UserRepository;
import com.finflow.core.family.service.FamilyService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExpenseService {
    public final ExpenseRepository expenseRepository;
    public final ExpenseParticipantRepository expenseParticipantRepository;
    public final UserRepository userRepository;

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

        expenseRepository.save(expense);

        List<ExpenseParticipant> participants = expenseCreateRequest.getParticipantIDs()
                .stream()
                .map(userId -> new ExpenseParticipant(expense,userId))
                .toList();
        
        expenseParticipantRepository.saveAll(participants);
        return "Đã ghi nhận khoản chi " + expense.getAmount() + " của " + user.getFullName() + " thành công!";
    }
}
