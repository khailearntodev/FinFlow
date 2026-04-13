package com.finflow.core.expense.domain;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "expense_participants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseParticipant {
    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class ParticipantId implements Serializable {
        @Column(name = "expense_id")
        private UUID expenseId;

        @Column(name = "user_id")
        private UUID userId;
    }

    @EmbeddedId
    private ParticipantId id = new ParticipantId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("expenseId")
    @JoinColumn(name = "expense_id")
    private Expense expense;

    public ExpenseParticipant(Expense expense, UUID userId) {
        this.expense = expense;
        this.id.setExpenseId(expense.getId());
        this.id.setUserId(userId);
    }
}