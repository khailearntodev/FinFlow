package com.finflow.core.family.repository;

import com.finflow.core.family.domain.Family;
import com.finflow.core.family.dto.AddMemberRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FamilyRepository  extends JpaRepository<Family, UUID> {
}
