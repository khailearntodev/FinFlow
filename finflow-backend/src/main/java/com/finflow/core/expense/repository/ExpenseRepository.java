package com.finflow.core.expense.repository;

import com.finflow.core.expense.domain.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    Optional<Expense> findById(UUID expenseId);
    List<Expense> findByFamilyId(UUID familyId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void deleteByFamilyId(UUID familyId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(e) > 0 FROM Expense e LEFT JOIN e.participants p " +
            "WHERE e.familyId = :familyId AND e.status = com.finflow.core.enums.ExpenseStatus.PENDING " +
            "AND (e.paidByUserId = :userIdStr OR p.id.userId = :userId)")
    boolean hasPendingExpenses(
            @org.springframework.data.repository.query.Param("familyId") java.util.UUID familyId,
            @org.springframework.data.repository.query.Param("userIdStr") String userIdStr,
            @org.springframework.data.repository.query.Param("userId") java.util.UUID userId
    );
}
