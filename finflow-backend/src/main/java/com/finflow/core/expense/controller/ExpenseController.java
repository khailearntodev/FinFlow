package com.finflow.core.expense.controller;

import com.finflow.core.expense.dto.ExpenseCreateRequest;
import com.finflow.core.expense.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
