package com.finflow.core.expense.controller;

import com.finflow.core.expense.dto.ExpenseCreateRequest;
import com.finflow.core.expense.dto.ExpenseResponse;
import com.finflow.core.expense.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/expense")
@RequiredArgsConstructor
public class ExpenseController {
    public final ExpenseService expenseService;

    @PostMapping("/create")
    public ResponseEntity<String> createExpense(@Valid @RequestBody ExpenseCreateRequest expenseCreateRequest) {
        expenseService.createExpense(expenseCreateRequest);
        return ResponseEntity.ok("Đã tạo bản ghi chi tiêu thành công!");
    }

    @GetMapping("/get")
    public ResponseEntity<ExpenseResponse> getExpenseById(@RequestParam("familyId") UUID familyId, @RequestParam("expenseId") UUID expenseId) {
        return ResponseEntity.ok(expenseService.getExpenseById(familyId, expenseId));
    }

    @GetMapping("/get-all")
    public ResponseEntity<Iterable<ExpenseResponse>> getAllExpensesByFamilyId(@RequestParam("familyId") UUID familyId) {
        return ResponseEntity.ok(expenseService.getAllExpensesByFamilyId(familyId));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteExpenseById(@RequestParam("expenseId") UUID expenseId, @RequestParam("familyId") UUID familyId) {
        expenseService.deleteExpense(familyId, expenseId);
        return ResponseEntity.ok("Đã xoa khoản chi thành công")
    }
}
