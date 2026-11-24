package com.finflow.core.expense.repository;

import com.finflow.core.expense.domain.Expense;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    Optional<Expense> findById(UUID expenseId);

    @EntityGraph(attributePaths = {"participants"})
    List<Expense> findByFamilyId(UUID familyId);

    @EntityGraph(attributePaths = {"participants"})
    List<Expense> findBySettlementIdOrderByExpenseDateDesc(UUID settlementId);

    @EntityGraph(attributePaths = {"participants"})
    @Query("SELECT e FROM Expense e WHERE e.familyId = :familyId AND e.expenseDate >= :startDate AND e.expenseDate <= :endDate")
    List<Expense> findByFamilyIdAndDateBetween(
            @Param("familyId") UUID familyId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("""
            SELECT EXTRACT(YEAR FROM e.expenseDate), EXTRACT(MONTH FROM e.expenseDate), COALESCE(SUM(e.amount), 0)
            FROM Expense e
            WHERE e.familyId = :familyId AND e.expenseDate >= :fromDate AND e.expenseDate <= :toDate
            GROUP BY EXTRACT(YEAR FROM e.expenseDate), EXTRACT(MONTH FROM e.expenseDate)
            ORDER BY EXTRACT(YEAR FROM e.expenseDate) ASC, EXTRACT(MONTH FROM e.expenseDate) ASC
            """)
    List<Object[]> sumMonthlySpending(
            @Param("familyId") UUID familyId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("""
            SELECT e.category, COALESCE(SUM(e.amount), 0)
            FROM Expense e
            WHERE e.familyId = :familyId AND e.expenseDate >= :startDate AND e.expenseDate <= :endDate
            GROUP BY e.category
            """)
    List<Object[]> sumByCategoryForPeriod(
            @Param("familyId") UUID familyId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Modifying
    @Transactional
    void deleteByFamilyId(UUID familyId);

    @Modifying
    @Transactional
    @Query("UPDATE Expense e SET e.status = com.finflow.core.enums.ExpenseStatus.PENDING, e.settlementId = null WHERE e.settlementId = :settlementId")
    void unlockExpensesBySettlementId(@Param("settlementId") UUID settlementId);

    @Query("SELECT COUNT(e) > 0 FROM Expense e LEFT JOIN e.participants p " +
            "WHERE e.familyId = :familyId AND e.status = com.finflow.core.enums.ExpenseStatus.PENDING " +
            "AND (e.paidByUserId = :userIdStr OR p.id.userId = :userId)")
    boolean hasPendingExpenses(
            @Param("familyId") UUID familyId,
            @Param("userIdStr") String userIdStr,
            @Param("userId") UUID userId
    );
}
