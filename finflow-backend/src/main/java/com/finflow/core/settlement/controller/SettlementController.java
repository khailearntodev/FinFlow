package com.finflow.core.settlement.controller;

import com.finflow.core.settlement.dto.SettlementCreateRequest;
import com.finflow.core.settlement.dto.SettlementResponse;
import com.finflow.core.settlement.service.SettlementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/settlement")
@RequiredArgsConstructor
public class SettlementController {
    private final SettlementService settlementService;

    @PostMapping("/create")
    public ResponseEntity<SettlementResponse> createSettlement(@Valid @RequestBody SettlementCreateRequest settlementCreateRequest) {
        return ResponseEntity.ok(settlementService.createSettlement(settlementCreateRequest));
    }

    @PostMapping(value = "/bills/{billId}/pay", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> submitPaymentProof(
            @PathVariable UUID billId,
            @RequestParam("email") String email,
            @RequestParam("file") MultipartFile file) {

        String result = settlementService.submitPaymentProof(billId, email, file);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/bills/{billId}/confirm")
    public ResponseEntity<String> confirmPayment(
            @PathVariable UUID billId,
            @RequestParam("email") String email) {

        String result = settlementService.confirmPayment(billId, email);
        return ResponseEntity.ok(result);
    }
}
