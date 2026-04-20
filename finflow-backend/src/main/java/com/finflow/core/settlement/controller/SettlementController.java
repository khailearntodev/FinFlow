package com.finflow.core.settlement.controller;

import com.finflow.core.settlement.dto.SettlementCreateRequest;
import com.finflow.core.settlement.dto.SettlementResponse;
import com.finflow.core.settlement.service.SettlementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settlement")
@RequiredArgsConstructor
public class SettlementController {
    private final SettlementService settlementService;

    @PostMapping("/create")
    public ResponseEntity<SettlementResponse> createSettlement(@Valid @RequestBody SettlementCreateRequest settlementCreateRequest) {
        return ResponseEntity.ok(settlementService.createSettlement(settlementCreateRequest));
    }
}
