package com.finflow.core.expense.repository;

import com.finflow.core.expense.domain.ExpenseParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseParticipantRepository extends JpaRepository<ExpenseParticipant, ExpenseParticipant.ParticipantId> {
}
