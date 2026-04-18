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
}
