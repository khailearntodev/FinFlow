package com.finflow.core.settlement.repository;

import com.finflow.core.settlement.domain.SettlementBill;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementBillRepository extends JpaRepository<SettlementBill, UUID> {
    @EntityGraph(attributePaths = {"settlement"})
    List<SettlementBill> findByUserId(UUID userId);

    @EntityGraph(attributePaths = {"settlement"})
    Optional<SettlementBill> findWithSettlementById(UUID id);
}
