package com.finflow.core.settlement.repository;

import com.finflow.core.settlement.domain.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, UUID> {
    Optional<Settlement> findByFamilyIdAndMonthAndYear(UUID familyId, Integer month, Integer year);
    List<Settlement> findByFamilyId(UUID familyId);
    void deleteByFamilyId(UUID familyId);
}
