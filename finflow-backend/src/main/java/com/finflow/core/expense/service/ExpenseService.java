package com.finflow.core.expense.service;

import com.finflow.core.audit.service.AuditService;
import com.finflow.core.enums.AuditEnum;
import com.finflow.core.enums.ExpenseCategory;
import com.finflow.core.enums.ExpenseStatus;
import com.finflow.core.enums.RoleEnum;
import com.finflow.core.exception.ExpenseException;
import com.finflow.core.exception.FamilyException;
import com.finflow.core.expense.domain.Expense;
import com.finflow.core.expense.domain.ExpenseParticipant;
import com.finflow.core.expense.dto.ExpenseAnalyticsResponse;
import com.finflow.core.expense.dto.ExpenseCreateRequest;
import com.finflow.core.expense.dto.ExpenseResponse;
import com.finflow.core.expense.repository.ExpenseParticipantRepository;
import com.finflow.core.expense.repository.ExpenseRepository;
import com.finflow.core.family.domain.Family;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.repository.FamilyRepository;
import com.finflow.core.family.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import javax.management.relation.Role;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExpenseService {
    public final ExpenseParticipantRepository expenseParticipantRepository;
    public final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final FamilyRepository familyRepository;
    private final AuditService auditService;

    @Transactional
    public String createExpense(ExpenseCreateRequest expenseCreateRequest, UUID operatorId) {
        User operator = userRepository.findById(operatorId)
                .orElseThrow(() -> new ExpenseException("Ủa hong thấy người thực hiện đâu hết á, kiểm tra lại nha!"));

        User payer = userRepository.findByEmail(expenseCreateRequest.getPaidByEmail())
                .orElseThrow(() -> new ExpenseException("Hong thấy người trả tiền đâu ròi, chọn lại nha!"));

        if (payer.getFamily() == null) throw new ExpenseException("Người trả tiền chưa vô gia đình nào hết á, vô nhà trước đi nha!");

        List<UUID> familyMemberIds = payer.getFamily().getMembers().stream()
                .map(User::getId)
                .toList();

        for (UUID participantId : expenseCreateRequest.getParticipantIDs()) {
            if (!familyMemberIds.contains(participantId)) {
                throw new ExpenseException("Bịp nha, có người hong phải thành viên nhà mình trong danh sách chia tiền á!");
            }
        }

        Expense expense = Expense.builder()
                .familyId(payer.getFamily().getId())
                .status(ExpenseStatus.PENDING)
                .category(expenseCreateRequest.getCategory() != null ? expenseCreateRequest.getCategory() : ExpenseCategory.OTHER)
                .amount(expenseCreateRequest.getAmount())
                .expenseDate(expenseCreateRequest.getExpenseDate())
                .title(expenseCreateRequest.getTitle())
                .paidByUserId(payer.getId().toString())
                .createdBy(operatorId)
                .build();

        List<ExpenseParticipant> participants = new ArrayList<>(
                expenseCreateRequest.getParticipantIDs()
                        .stream()
                        .distinct()
                        .map(userId -> new ExpenseParticipant(expense, userId))
                        .toList()
        );

        expense.setParticipants(participants);
        expenseRepository.save(expense);

        auditService.logExpenseChange(
                payer.getFamily().getId(),
                operatorId,
                AuditEnum.CREATE,
                expense.getId(),
                null,
                extractExpenseSnapshot(expense)
        );

        return "Đã ghi nhận khoản chi " + expense.getAmount() + " của " + payer.getFullName() + " thành công!";
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ExpenseResponse getExpenseById(UUID familyId, UUID expenseId){
        Expense expense = expenseRepository.findById(expenseId).orElseThrow(
                () -> new ExpenseException("Khoản chi này bay màu hay gì ròi, tìm hong thấy á!")
        );

        Family family = familyRepository.findById(familyId).orElseThrow(
                () -> new ExpenseException("Hong tìm thấy gia đình này đâu nha!")
        );

        if (!family.getId().equals(expense.getFamilyId())) {
            throw new ExpenseException("Bịp nha, khoản chi này đâu phải của nhà mình!");
        }

        User payer = userRepository.findById(UUID.fromString(expense.getPaidByUserId())).orElseThrow(
                () -> new ExpenseException("Hong thấy người trả tiền đâu ròi!")
        );

        List<UUID> participantIds = expense.getParticipants().stream()
                .map(u->u.getId().getUserId())
                .toList();

        List<String> participantEmails = userRepository.findAllById(participantIds).stream()
                .map(User::getEmail)
                .toList();

        return ExpenseResponse.builder()
                .id(expense.getId().toString())
                .title(expense.getTitle())
                .amount(expense.getAmount())
                .expenseDate(expense.getExpenseDate())
                .paidByEmail(payer.getEmail())
                .participants(participantEmails)
                .build();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ExpenseResponse> getAllExpensesByFamilyId(UUID familyId){
        List<Expense> expenses = expenseRepository.findByFamilyId(familyId);

        Set<UUID> allUserIds = new HashSet<>();
        for (Expense expense : expenses) {
            allUserIds.add(UUID.fromString(expense.getPaidByUserId()));
            for (ExpenseParticipant ep : expense.getParticipants()) {
                allUserIds.add(ep.getId().getUserId());
            }
        }
        
        Map<UUID, User> userMap = new HashMap<>();
        if (!allUserIds.isEmpty()) {
            userRepository.findAllById(allUserIds).forEach(user -> userMap.put(user.getId(), user));
        }

        return expenses.stream().map(expense -> {

            User payer = userMap.get(UUID.fromString(expense.getPaidByUserId()));
            if (payer == null) {
                throw new ExpenseException("Hong tìm thấy người trả tiền cho khoản \"" + expense.getTitle() + "\" ròi!");
            }

            List<String> participantEmails = expense.getParticipants().stream()
                    .map(ep -> {
                        User p = userMap.get(ep.getId().getUserId());
                        return p != null ? p.getEmail() : null;
                    })
                    .filter(Objects::nonNull)
                    .toList();

            return ExpenseResponse.builder()
                    .id(expense.getId().toString())
                    .title(expense.getTitle())
                    .amount(expense.getAmount())
                    .expenseDate(expense.getExpenseDate())
                    .paidByEmail(payer.getEmail())
                    .participants(participantEmails)
                    .status(expense.getStatus())
                    .category(expense.getCategory() != null ? expense.getCategory() : ExpenseCategory.OTHER)
                    .build();

        }).toList();
    }

    @Transactional
    public void deleteExpense(UUID familyId, UUID expenseId, UUID userId){
        Expense expense = expenseRepository.findById(expenseId).orElseThrow(
                () -> new ExpenseException("Khoản chi này hong tồn tại hoặc bị xóa mất ròi nha!")
        );

        User user = userRepository.findById(userId).orElseThrow(
                () -> new ExpenseException("Hong thấy tài khoản của bạn đâu hết á!")
        );

        if (expense.getStatus() == ExpenseStatus.SETTLED) {
            throw new ExpenseException("Khoản chi này chốt sổ ròi, hong xóa được nữa nha!");
        }

        if (!expense.getFamilyId().equals(familyId)) {
            throw new ExpenseException("Khoản chi này đâu phải của nhà mình đâu, bịp vừa thôi nha!");
        }
        Map<String, Object> oldData = extractExpenseSnapshot(expense);

        expenseRepository.delete(expense);

        auditService.logExpenseChange(
                expense.getFamilyId(),
                userId,
                AuditEnum.DELETE,
                expense.getId(),
                oldData,
                null
        );
    }

    @Transactional
    public ExpenseResponse updateExpense(UUID familyId, UUID expenseId, ExpenseCreateRequest expenseCreateRequest, UUID userId){
 
        Expense expense = expenseRepository.findById(expenseId).orElseThrow(
                () -> new ExpenseException("Khoản chi này hong tồn tại ròi nha!")
        );
 
        User user = userRepository.findById(userId).orElseThrow(
                () -> new ExpenseException("Hong thấy người thực hiện đâu hết á!")
        );
 
        if (!expense.getFamilyId().equals(familyId)) {
            throw new ExpenseException("Khoản chi này hong phải của nhà mình đâu nha!");
        }
 
        if (expense.getStatus() == ExpenseStatus.SETTLED) {
            throw new ExpenseException("Khoản chi này chốt sổ mất tiêu ròi, sửa hong được nữa nha!");
        }
 
        User payer = userRepository.findByEmail(expenseCreateRequest.getPaidByEmail())
                .orElseThrow(() -> new ExpenseException("Người trả tiền hong hợp lệ ròi, chọn lại nha!"));
 
        if (payer.getFamily() == null || !payer.getFamily().getId().equals(familyId)) {
            throw new ExpenseException("Người trả tiền phải là người trong nhà mình mới ok nha!");
        }

        Map<String, Object> oldData = extractExpenseSnapshot(expense);

        List<UUID> familyMemberIds = payer.getFamily().getMembers().stream()
                .map(User::getId)
                .toList();

        for (UUID participantId : expenseCreateRequest.getParticipantIDs()) {
            if (!familyMemberIds.contains(participantId)) {
                throw new ExpenseException("Bịp nha, có người được chia tiền hong nằm trong nhà mình á!");
            }
        }

        expense.setTitle(expenseCreateRequest.getTitle());
        expense.setAmount(expenseCreateRequest.getAmount());
        expense.setExpenseDate(expenseCreateRequest.getExpenseDate());
        expense.setPaidByUserId(payer.getId().toString());
        if (expenseCreateRequest.getCategory() != null) {
            expense.setCategory(expenseCreateRequest.getCategory());
        } else if (expense.getCategory() == null) {
            expense.setCategory(ExpenseCategory.OTHER);
        }
        expense.setUpdatedBy(userId);

        List<UUID> newParticipantIds = expenseCreateRequest.getParticipantIDs().stream()
                .distinct()
                .toList();

        expense.getParticipants().removeIf(p -> !newParticipantIds.contains(p.getId().getUserId()));

        List<UUID> currentParticipantIds = expense.getParticipants().stream()
                .map(p -> p.getId().getUserId())
                .toList();

        for (UUID newId : newParticipantIds) {
            if (!currentParticipantIds.contains(newId)) {
                expense.getParticipants().add(new ExpenseParticipant(expense, newId));
            }
        }

        // expenseRepository.save(expense); // Removed to prevent Hibernate merge duplication on attached entity

        Map<String, Object> newData = extractExpenseSnapshot(expense);
        List<String> expectedParticipantIds = newParticipantIds.stream()
                .map(UUID::toString)
                .toList();
        newData.put("participants", expectedParticipantIds);

        auditService.logExpenseChange(
                expense.getFamilyId(),
                userId,
                AuditEnum.UPDATE,
                expense.getId(),
                oldData,
                newData
        );

        List<String> participantEmails = userRepository.findAllById(expenseCreateRequest.getParticipantIDs())
                .stream().map(User::getEmail).toList();

        return ExpenseResponse.builder()
                .id(expenseId.toString())
                .title(expense.getTitle())
                .amount(expense.getAmount())
                .expenseDate(expense.getExpenseDate())
                .paidByEmail(payer.getEmail())
                .participants(participantEmails)
                .category(expense.getCategory() != null ? expense.getCategory() : ExpenseCategory.OTHER)
                .build();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ExpenseAnalyticsResponse getAnalytics(UUID familyId, int months) {
        int safeMonths = Math.min(Math.max(months, 1), 12);
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new ExpenseException("Hong thấy gia đình này đâu ròi nha!"));

        java.time.YearMonth currentYm = java.time.YearMonth.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        java.time.YearMonth startYm = currentYm.minusMonths(safeMonths - 1L);

        java.time.LocalDate fromDate = startYm.atDay(1);
        java.time.LocalDate toDate = currentYm.atEndOfMonth();

        List<Object[]> monthlyRows = expenseRepository.sumMonthlySpending(familyId, fromDate, toDate);
        Map<String, java.math.BigDecimal> monthlyMap = new HashMap<>();
        for (Object[] row : monthlyRows) {
            int y = ((Number) row[0]).intValue();
            int m = ((Number) row[1]).intValue();
            java.math.BigDecimal sum = row[2] instanceof java.math.BigDecimal bd
                    ? bd
                    : java.math.BigDecimal.valueOf(((Number) row[2]).doubleValue());
            monthlyMap.put(y + "-" + m, sum);
        }

        List<ExpenseAnalyticsResponse.MonthlyPoint> trend = new ArrayList<>();
        for (int i = 0; i < safeMonths; i++) {
            java.time.YearMonth ym = startYm.plusMonths(i);
            java.math.BigDecimal total = monthlyMap.getOrDefault(ym.getYear() + "-" + ym.getMonthValue(), java.math.BigDecimal.ZERO);
            trend.add(ExpenseAnalyticsResponse.MonthlyPoint.builder()
                    .year(ym.getYear())
                    .month(ym.getMonthValue())
                    .label("T" + ym.getMonthValue() + "/" + (ym.getYear() % 100))
                    .totalAmount(total)
                    .build());
        }

        java.math.BigDecimal currentMonthTotal = monthlyMap.getOrDefault(
                currentYm.getYear() + "-" + currentYm.getMonthValue(), java.math.BigDecimal.ZERO
        );

        List<Object[]> categoryRows = expenseRepository.sumByCategoryForPeriod(
                familyId, currentYm.atDay(1), currentYm.atEndOfMonth()
        );
        Map<ExpenseCategory, java.math.BigDecimal> categoryTotals = new EnumMap<>(ExpenseCategory.class);
        for (Object[] row : categoryRows) {
            ExpenseCategory cat = row[0] instanceof ExpenseCategory ec ? ec : ExpenseCategory.OTHER;
            java.math.BigDecimal amt = row[1] instanceof java.math.BigDecimal bd
                    ? bd
                    : java.math.BigDecimal.valueOf(((Number) row[1]).doubleValue());
            categoryTotals.merge(cat, amt, java.math.BigDecimal::add);
        }

        List<ExpenseAnalyticsResponse.CategorySlice> breakdown = categoryTotals.entrySet().stream()
                .sorted(Map.Entry.<ExpenseCategory, java.math.BigDecimal>comparingByValue().reversed())
                .map(entry -> {
                    double pct = currentMonthTotal.compareTo(java.math.BigDecimal.ZERO) > 0
                            ? entry.getValue().multiply(java.math.BigDecimal.valueOf(100))
                            .divide(currentMonthTotal, 1, java.math.RoundingMode.HALF_UP).doubleValue()
                            : 0.0;
                    return ExpenseAnalyticsResponse.CategorySlice.builder()
                            .category(entry.getKey())
                            .amount(entry.getValue())
                            .percentage(pct)
                            .build();
                })
                .toList();

        java.math.BigDecimal budget = family.getMonthlyBudget();
        Double usagePercent = null;
        String budgetStatus = "NONE";
        if (budget != null && budget.compareTo(java.math.BigDecimal.ZERO) > 0) {
            usagePercent = currentMonthTotal.multiply(java.math.BigDecimal.valueOf(100))
                    .divide(budget, 1, java.math.RoundingMode.HALF_UP)
                    .doubleValue();
            if (usagePercent > 100.0) {
                budgetStatus = "EXCEEDED";
            } else if (usagePercent >= 80.0) {
                budgetStatus = "WARNING";
            } else {
                budgetStatus = "SAFE";
            }
        }

        return ExpenseAnalyticsResponse.builder()
                .currentMonthTotal(currentMonthTotal)
                .monthlyBudget(budget)
                .budgetUsagePercent(usagePercent)
                .budgetStatus(budgetStatus)
                .monthlyTrend(trend)
                .categoryBreakdown(breakdown)
                .build();
    }

    private Map<String, Object> extractExpenseSnapshot(Expense expense) {
        if (expense == null) return null;

        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("title", expense.getTitle());
        snapshot.put("amount", expense.getAmount());
        snapshot.put("expenseDate", expense.getExpenseDate().toString());
        snapshot.put("paidByUserId", expense.getPaidByUserId());
        snapshot.put("status", expense.getStatus());

        if (expense.getParticipants() != null) {
            List<String> participantIds = expense.getParticipants().stream()
                    .map(p -> p.getId().getUserId().toString())
                    .toList();
            snapshot.put("participants", participantIds);
        }

        return snapshot;
    }

    @Transactional
    public byte[] exportMonthlyExpensesToExcel(UUID familyId, int month, int year) {
        Family family = familyRepository.findById(familyId).orElseThrow(
                () -> new ExpenseException("Hong tìm thấy gia đình đâu hết á!")
        );

        java.time.LocalDate startDate = java.time.LocalDate.of(year, month, 1);
        java.time.LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        List<Expense> expenses = expenseRepository.findByFamilyIdAndDateBetween(familyId, startDate, endDate);

        if (expenses.isEmpty()) {
            throw new ExpenseException("Tháng " + month + "/" + year + " chưa có khoản chi nào hết á, có gì đâu mà xuất Excel nha!");
        }

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Chi tieu Thang " + month + "-" + year);

            List<User> members = new ArrayList<>(family.getMembers());
            members.sort(Comparator.comparing(User::getFullName));
            Map<UUID, User> memberMap = new HashMap<>();
            for (User member : members) {
                memberMap.put(member.getId(), member);
            }

            List<String> headersList = new ArrayList<>(Arrays.asList("Ngày chi", "Tiêu đề", "Tổng số tiền (VND)", "Người chi trả", "Trạng thái"));
            for (User member : members) {
                headersList.add(member.getFullName());
            }
            String[] headers = headersList.toArray(new String[0]);

            Row headerRow = sheet.createRow(0);
            
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Expense expense : expenses) {
                Row row = sheet.createRow(rowIdx++);

                // Cột 0: Ngày chi
                row.createCell(0).setCellValue(expense.getExpenseDate().toString());
                
                // Cột 1: Tiêu đề
                row.createCell(1).setCellValue(expense.getTitle());
                
                // Cột 2: Số tiền
                row.createCell(2).setCellValue(expense.getAmount().doubleValue());

                // Cột 3: Người chi trả
                UUID payerId = UUID.fromString(expense.getPaidByUserId());
                User payer = memberMap.computeIfAbsent(payerId, id -> userRepository.findById(id).orElse(null));
                row.createCell(3).setCellValue(payer != null ? payer.getFullName() : "N/A");

                // Cột 4: Trạng thái
                String statusVi = expense.getStatus() == ExpenseStatus.SETTLED ? "Đã chốt sổ" : "Chưa chốt";
                row.createCell(4).setCellValue(statusVi);

                // Cột 5+: Tiền chia cho từng người
                List<UUID> participantIds = expense.getParticipants().stream()
                        .map(ep -> ep.getId().getUserId())
                        .toList();
                
                int numParticipants = participantIds.size();
                double sharedAmount = numParticipants > 0 ? expense.getAmount().doubleValue() / numParticipants : 0.0;

                int colIdx = 5;
                for (User member : members) {
                    Cell cell = row.createCell(colIdx++);
                    if (participantIds.contains(member.getId())) {
                        cell.setCellValue(sharedAmount);
                    } else {
                        cell.setCellValue(0.0);
                    }
                }
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();

        } catch (IOException e) {
            throw new ExpenseException("Tạo file Excel bị lỗi ngang ròi, thử lại sau nha: " + e.getMessage());
        }
    }
}
