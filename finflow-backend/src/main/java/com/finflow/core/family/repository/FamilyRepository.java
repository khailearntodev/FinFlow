package com.finflow.core.family.repository;

import com.finflow.core.family.domain.Family;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FamilyRepository extends JpaRepository<Family, UUID> {
    @EntityGraph(attributePaths = {"members"})
    List<Family> findByBillingDate(Integer billingDate);
}
