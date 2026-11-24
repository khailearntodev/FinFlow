package com.finflow.core.settlement.util;

import com.finflow.core.expense.domain.Expense;
import com.finflow.core.expense.domain.ExpenseParticipant;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class ExpenseShareCalculator {

    private ExpenseShareCalculator() {
    }

    /**
     * Tính số tiền mỗi thành viên phải chịu cho 1 khoản chi (bao gồm xử lý tiền lẻ chính xác như createSettlement).
     */
    public static Map<UUID, BigDecimal> calculateShares(Expense expense) {
        Map<UUID, BigDecimal> shares = new LinkedHashMap<>();
        List<ExpenseParticipant> participants = expense.getParticipants();
        if (participants == null || participants.isEmpty()) {
            return shares;
        }

        int count = participants.size();
        BigDecimal shareAmount = expense.getAmount()
                .divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
        BigDecimal totalShared = shareAmount.multiply(BigDecimal.valueOf(count));
        BigDecimal remainder = expense.getAmount().subtract(totalShared);

        boolean remainderAssigned = false;
        for (ExpenseParticipant participant : participants) {
            UUID pId = participant.getId().getUserId();
            BigDecimal amountToOwe = shareAmount;
            if (!remainderAssigned && remainder.compareTo(BigDecimal.ZERO) != 0) {
                amountToOwe = amountToOwe.add(remainder);
                remainderAssigned = true;
            }
            shares.put(pId, amountToOwe);
        }
        return shares;
    }
}
