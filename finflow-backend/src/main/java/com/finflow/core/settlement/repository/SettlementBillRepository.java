package com.finflow.core.settlement.repository;

import com.finflow.core.settlement.domain.SettlementBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SettlementBillRepository extends JpaRepository<SettlementBill, UUID> {
    List<SettlementBill> findByUserId(UUID userId);
}
