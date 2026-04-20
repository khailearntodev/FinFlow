package com.finflow.core.settlement.repository;

import com.finflow.core.settlement.domain.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, UUID> {
    Optional<Settlement> findBySettlementIdAndMonthAndYear(String settlementId, Integer month, Integer year);

    boolean findByFamilyIdAfterAndMonthAndYear(UUID familyIdAfter, Integer month, Integer year);
}
