package com.finflow.core.settlement.service;

import com.finflow.core.enums.ExpenseStatus;
import com.finflow.core.enums.RoleEnum;
import com.finflow.core.enums.SettlementBillStatusEnum;
import com.finflow.core.enums.SettlementStatusEnum;
import com.finflow.core.exception.ExpenseException;
import com.finflow.core.exception.SettlementException;
import com.finflow.core.expense.domain.Expense;
import com.finflow.core.expense.repository.ExpenseRepository;
import com.finflow.core.family.domain.Family;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.repository.FamilyRepository;
import com.finflow.core.family.repository.UserRepository;
import com.finflow.core.notification.service.EmailService;
import com.finflow.core.settlement.domain.Settlement;
import com.finflow.core.settlement.domain.SettlementBill;
import com.finflow.core.settlement.dto.BillBreakdownResponse;
import com.finflow.core.settlement.dto.BillDetail;
import com.finflow.core.settlement.dto.SettlementCreateRequest;
import com.finflow.core.settlement.dto.SettlementResponse;
import com.finflow.core.settlement.repository.SettlementBillRepository;
import com.finflow.core.settlement.repository.SettlementRepository;
import com.finflow.core.settlement.util.ExpenseShareCalculator;
import com.finflow.core.settlement.util.VietQrBuilder;
import com.finflow.core.storage.service.StorageService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettlementService {
    public final SettlementRepository settlementRepository;
    public final SettlementBillRepository settlementBillRepository;
    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final ExpenseRepository expenseRepository;

    private final StorageService storageService;
    private final EmailService emailService;

    private final Map<UUID, LocalDateTime> lastRemindedMap = new ConcurrentHashMap<>();

    @Value("${finflow.settlement.remind-cooldown-minutes:60}")
    private long remindCooldownMinutes = 60;

    @Transactional
    public SettlementResponse createSettlement(SettlementCreateRequest settlementCreateRequest) {
        User holdFamily = userRepository.findByEmail(settlementCreateRequest.getHoldEmail())
                .orElseThrow(
                        () -> new SettlementException("Hong tìm thấy người tạo yêu cầu chốt sổ đâu ròi!"));

        Family family = familyRepository.findById(UUID.fromString(settlementCreateRequest.getFamilyId())).orElseThrow(
                () -> new SettlementException("Hong thấy gia đình này đâu hết á!"));

        boolean isFamilyHead = family.getMembers().contains(holdFamily);
        if (!isFamilyHead || holdFamily.getRole() == RoleEnum.USER) {
            throw new ExpenseException("Chỉ Chủ hộ mới được bấm chốt sổ nha!");
        }

        if (settlementRepository.findByFamilyIdAndMonthAndYear(family.getId(), settlementCreateRequest.getMonth(),
                settlementCreateRequest.getYear()).isPresent()) {
            throw new SettlementException("Tháng này chốt sổ mất tiêu ròi, khỏi bấm lại nha!");
        }

        List<Expense> pendingExpenses = expenseRepository.findByFamilyId(family.getId())
                .stream()
                .filter(e -> e.getStatus() == ExpenseStatus.PENDING)
                .filter(e -> {
                    if (e.getExpenseDate().getYear() < settlementCreateRequest.getYear())
                        return true;
                    if (e.getExpenseDate().getYear() == settlementCreateRequest.getYear()) {
                        return e.getExpenseDate().getMonthValue() <= settlementCreateRequest.getMonth();
                    }
                    return false;
                })
                .toList();

        if (pendingExpenses.isEmpty()) {
            throw new SettlementException("Tháng này chưa có khoản chi nào hết á, có gì đâu mà chốt sổ nha!");
        }

        Map<UUID, BigDecimal> paidMap = new HashMap<>();
        Map<UUID, BigDecimal> owedMap = new HashMap<>();

        for (User user : family.getMembers()) {
            paidMap.put(user.getId(), BigDecimal.ZERO);
            owedMap.put(user.getId(), BigDecimal.ZERO);
        }

        for (Expense expense : pendingExpenses) {
            UUID payerId = UUID.fromString(expense.getPaidByUserId());
            paidMap.put(payerId, paidMap.getOrDefault(payerId, BigDecimal.ZERO).add(expense.getAmount()));

            Map<UUID, BigDecimal> shares = ExpenseShareCalculator.calculateShares(expense);
            for (Map.Entry<UUID, BigDecimal> entry : shares.entrySet()) {
                owedMap.put(entry.getKey(), owedMap.getOrDefault(entry.getKey(), BigDecimal.ZERO).add(entry.getValue()));
            }
        }

        Settlement settlement = Settlement.builder()
                .familyId(UUID.fromString(settlementCreateRequest.getFamilyId()))
                .month(settlementCreateRequest.getMonth())
                .year(settlementCreateRequest.getYear())
                .status(SettlementStatusEnum.PENDING)
                .build();

        settlementRepository.save(settlement);

        List<SettlementBill> billsToSave = new ArrayList<>();
        List<BillDetail> billDetails = new ArrayList<>();
        BigDecimal totalVerification = BigDecimal.ZERO;

        for (User member : family.getMembers()) {
            UUID memberId = member.getId();
            BigDecimal netAmount = owedMap.get(memberId).subtract(paidMap.get(memberId));
            totalVerification = totalVerification.add(netAmount);

            SettlementBill bill = SettlementBill.builder()
                    .settlement(settlement)
                    .userId(memberId)
                    .amount(netAmount)
                    .status(SettlementBillStatusEnum.PENDING)
                    .build();

            billsToSave.add(bill);
        }

        if (totalVerification.compareTo(BigDecimal.ZERO) != 0) {
            throw new SettlementException("Ủa bịp nha, tiền tính ra bị lệch ròi, kiểm tra lại liền đi!");
        }

        settlementBillRepository.saveAll(billsToSave);
        for (Expense expense : pendingExpenses) {
            expense.setStatus(ExpenseStatus.SETTLED);
            expense.setSettlementId(settlement.getId());
        }
        expenseRepository.saveAll(pendingExpenses);

        Map<UUID, User> membersMap = family.getMembers().stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        for (SettlementBill savedBill : billsToSave) {
            User member = membersMap.get(savedBill.getUserId());
            billDetails.add(buildBillDetail(savedBill, member, holdFamily, settlement.getMonth(), settlement.getYear()));
        }

        // Gửi email bất đồng bộ sau khi DB commit
        notifyFamilyMembersOfSettlement(family, holdFamily, settlement, billsToSave);

        return SettlementResponse.builder()
                .settlementId(settlement.getId().toString())
                .month(settlement.getMonth())
                .year(settlement.getYear())
                .status(settlement.getStatus())
                .createdAt(settlement.getCreatedAt())
                .bills(billDetails)
                .build();
    }

    private void notifyFamilyMembersOfSettlement(Family family, User head, Settlement settlement, List<SettlementBill> bills) {
        String subject = "FinFlow | Kỳ chốt sổ tháng " + settlement.getMonth() + "/" + settlement.getYear() + " đã được tạo";
        String deepLink = emailService.buildSettlementLink(settlement.getMonth(), settlement.getYear());
        String ctaHtml = buildDeepLinkButtonHtml(deepLink, "Xem chi tiết công nợ trên FinFlow");

        for (User member : family.getMembers()) {
            SettlementBill memberBill = bills.stream()
                    .filter(b -> b.getUserId().equals(member.getId()))
                    .findFirst().orElse(null);

            if (memberBill == null) continue;

            String amountInfo;
            String qrHtml = "";
            if (memberBill.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                amountInfo = "<p>Bạn cần thanh toán: <b style=\"color:#b42318;\">" + String.format("%,.0f", memberBill.getAmount()) + " VND</b></p>";
                String memo = VietQrBuilder.buildTransferContent(settlement.getMonth(), settlement.getYear(), member.getFullName(), false);
                String emailQrUrl = VietQrBuilder.buildEmailQrUrl(
                        head.getBankCode(), head.getBankAccountNumber(), head.getBankAccountName(), memberBill.getAmount(), memo
                );
                if (emailQrUrl != null) {
                    qrHtml = buildEmailQrBlockHtml(emailQrUrl, head, memo);
                }
            } else if (memberBill.getAmount().compareTo(BigDecimal.ZERO) < 0) {
                amountInfo = "<p>Bạn sẽ nhận lại: <b style=\"color:#1b7352;\">" + String.format("%,.0f", memberBill.getAmount().abs()) + " VND</b></p>";
            } else {
                amountInfo = "<p>Bạn đã hoàn tất công nợ kỳ này (0 VND).</p>";
            }

            String body = String.format(
                    "<html><body style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#172420;line-height:1.6;\">" +
                            "<h2>Kỳ chốt sổ mới đã được tạo</h2>" +
                            "<p>Chào <b>%s</b>,</p>" +
                            "<p>Chủ hộ đã tạo kỳ chốt sổ cho tháng <b>%d/%d</b>.</p>" +
                            "%s" +
                            "%s" +
                            "<p>Vui lòng mở FinFlow để xem bảng kê chi tiết và nộp minh chứng thanh toán nếu cần.</p>" +
                            "%s" +
                            "<hr/><p style=\"font-size:12px;color:#6c7f78;\"><i>Đây là email tự động từ hệ thống FinFlow.</i></p>" +
                            "</body></html>",
                    member.getFullName(),
                    settlement.getMonth(),
                    settlement.getYear(),
                    amountInfo,
                    qrHtml,
                    ctaHtml
            );

            emailService.sendEmailAfterCommit(member.getEmail(), subject, body);
        }
    }

    @Transactional
    public String submitPaymentProof(UUID billId, String userEmail, MultipartFile proofFile) {
        User user = userRepository.findByEmail(userEmail).orElseThrow(
                () -> new SettlementException("Hong tìm thấy tài khoản của bạn đâu ròi!"));

        SettlementBill bill = settlementBillRepository.findWithSettlementById(billId).orElseThrow(
                () -> new SettlementException("Hong thấy hóa đơn này đâu hết á!"));

        if (bill.getStatus() != SettlementBillStatusEnum.PENDING) {
            throw new SettlementException("Hóa đơn này xử lý ròi hoặc hong hợp lệ á, chọn đúng hóa đơn tháng này nha!");
        }

        if (user.getFamily() == null || !user.getFamily().getId().equals(bill.getSettlement().getFamilyId())) {
            throw new SettlementException("Bịp nha, hóa đơn này đâu phải của nhà mình!");
        }

        if (!user.getId().equals(bill.getUserId())) {
            throw new SettlementException("Ai nấy nộp biên lai của mình thôi nha, hong nộp giùm được á!");
        }

        String proofUrl = storageService.uploadImage(proofFile);

        bill.setProofImageUrl(proofUrl);
        bill.setStatus(SettlementBillStatusEnum.WAITING_FOR_CONFIRMATION);
        settlementBillRepository.save(bill);

        notifyOtherMembersOfPaymentProof(user, bill);

        return "Nộp minh chứng thành công! Đang đợi chủ hộ xác nhận!";
    }

    private void notifyOtherMembersOfPaymentProof(User payer, SettlementBill bill) {
        Family family = payer.getFamily();
        if (family == null)
            return;

        int month = bill.getSettlement().getMonth();
        int year = bill.getSettlement().getYear();
        String deepLink = emailService.buildSettlementLink(month, year);
        String ctaHtml = buildDeepLinkButtonHtml(deepLink, "Kiểm tra và xác nhận trên FinFlow");

        String subject = "FinFlow | Thành viên " + payer.getFullName() + " đã nộp minh chứng thanh toán";
        String body = String.format(
                "<html><body style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#172420;line-height:1.6;\">" +
                        "<h2>Thông báo nộp minh chứng thanh toán</h2>" +
                        "<p>Thành viên <b>%s</b> đã nộp minh chứng thanh toán cho kỳ chốt sổ tháng <b>%d/%d</b>.</p>" +
                        "<p>Số tiền: <b>%,.0f VND</b></p>" +
                        "<p>Trạng thái hóa đơn: <b>Đang chờ xác nhận</b></p>" +
                        "%s" +
                        "<hr/><p style=\"font-size:12px;color:#6c7f78;\"><i>Đây là email tự động từ hệ thống FinFlow.</i></p>" +
                        "</body></html>",
                payer.getFullName(),
                month,
                year,
                bill.getAmount().abs(),
                ctaHtml);

        family.getMembers().stream()
                .filter(member -> !member.getId().equals(payer.getId()))
                .forEach(member -> emailService.sendEmailAfterCommit(member.getEmail(), subject, body));
    }

    @Transactional
    public String confirmPayment(UUID billId, String headEmail) {
        User head = userRepository.findByEmail(headEmail).orElseThrow(
                () -> new SettlementException("Hong tìm thấy Chủ hộ đâu ròi!"));

        SettlementBill bill = settlementBillRepository.findWithSettlementById(billId).orElseThrow(
                () -> new SettlementException("Hong thấy hóa đơn này đâu hết á!"));

        Settlement settlement = bill.getSettlement();

        if (head.getRole() != RoleEnum.HEAD || !head.getFamily().getId().equals(bill.getSettlement().getFamilyId())) {
            throw new SettlementException("Chỉ Chủ hộ mới được duyệt thanh toán nha!");
        }

        if (bill.getStatus() == SettlementBillStatusEnum.COMPLETED) {
            throw new SettlementException("Hóa đơn này duyệt ok ròi, khỏi bấm nữa nha!");
        }

        if (bill.getStatus() == SettlementBillStatusEnum.PENDING && bill.getAmount().compareTo(BigDecimal.ZERO) >= 0) {
            if (!bill.getUserId().equals(head.getId())) {
                throw new SettlementException("Khoan nha, người ta chưa nộp biên lai chuyển khoản á!");
            }
        }

        bill.setStatus(SettlementBillStatusEnum.COMPLETED);
        settlementBillRepository.save(bill);

        boolean isAllCompleted = settlement.getSettlementBills().stream()
                .allMatch(b -> b.getStatus() == SettlementBillStatusEnum.COMPLETED);
        if (isAllCompleted) {
            settlement.setStatus(SettlementStatusEnum.COMPLETED);
            settlementRepository.save(settlement);
        }
        return "Xác nhận thanh toán thành công!";
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<SettlementResponse> getSettlementsByFamilyId(UUID familyId) {
        List<Settlement> allSettlements = settlementRepository.findByFamilyId(familyId);

        List<User> members = userRepository.findByFamilyId(familyId);
        Map<UUID, User> membersMap = members.stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        User headUser = members.stream()
                .filter(u -> u.getRole() == RoleEnum.HEAD)
                .findFirst()
                .orElse(null);

        Map<String, Settlement> bestSettlements = new HashMap<>();
        for (Settlement s : allSettlements) {
            String key = s.getMonth() + "-" + s.getYear();
            Settlement existing = bestSettlements.get(key);
            if (existing == null) {
                bestSettlements.put(key, s);
            } else {
                long existingCompleted = existing.getSettlementBills().stream()
                        .filter(b -> b.getStatus() == SettlementBillStatusEnum.COMPLETED).count();
                long currentCompleted = s.getSettlementBills().stream()
                        .filter(b -> b.getStatus() == SettlementBillStatusEnum.COMPLETED).count();
                if (currentCompleted > existingCompleted) {
                    bestSettlements.put(key, s);
                } else if (currentCompleted == existingCompleted && s.getCreatedAt().isAfter(existing.getCreatedAt())) {
                    bestSettlements.put(key, s);
                }
            }
        }

        return bestSettlements.values().stream()
                .map(s -> SettlementResponse.builder()
                        .settlementId(s.getId().toString())
                        .month(s.getMonth())
                        .year(s.getYear())
                        .status(s.getStatus())
                        .createdAt(s.getCreatedAt())
                        .bills(s.getSettlementBills().stream()
                                .map(b -> buildBillDetail(b, membersMap.get(b.getUserId()), headUser, s.getMonth(), s.getYear()))
                                .toList())
                        .build())
                .toList();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<BillDetail> getBillsByUserId(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        return settlementBillRepository.findByUserId(userId).stream()
                .map(b -> BillDetail.builder()
                        .id(b.getId())
                        .userEmail(user != null ? user.getEmail() : "N/A")
                        .fullName(user != null ? user.getFullName() : "N/A")
                        .amount(b.getAmount())
                        .status(b.getStatus())
                        .proofImageUrl(b.getProofImageUrl())
                        .month(b.getSettlement().getMonth())
                        .year(b.getSettlement().getYear())
                        .build())
                .toList();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public BillBreakdownResponse getBillBreakdown(UUID billId) {
        SettlementBill bill = settlementBillRepository.findWithSettlementById(billId)
                .orElseThrow(() -> new SettlementException("Hong tìm thấy hóa đơn này đâu ròi!"));

        Settlement settlement = bill.getSettlement();
        UUID memberId = bill.getUserId();

        List<Expense> settledExpenses = expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlement.getId());
        Map<UUID, User> membersMap = userRepository.findByFamilyId(settlement.getFamilyId()).stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        User member = membersMap.get(memberId);

        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalOwed = BigDecimal.ZERO;
        List<BillBreakdownResponse.BreakdownItem> items = new ArrayList<>();

        for (Expense expense : settledExpenses) {
            UUID payerId = UUID.fromString(expense.getPaidByUserId());
            BigDecimal myPaid = payerId.equals(memberId) ? expense.getAmount() : BigDecimal.ZERO;

            Map<UUID, BigDecimal> shares = ExpenseShareCalculator.calculateShares(expense);
            BigDecimal myShare = shares.getOrDefault(memberId, BigDecimal.ZERO);

            if (myPaid.compareTo(BigDecimal.ZERO) == 0 && myShare.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }

            totalPaid = totalPaid.add(myPaid);
            totalOwed = totalOwed.add(myShare);

            User payer = membersMap.get(payerId);
            String payerName = payer != null ? payer.getFullName() : "Thành viên cũ";

            items.add(BillBreakdownResponse.BreakdownItem.builder()
                    .expenseId(expense.getId())
                    .title(expense.getTitle())
                    .expenseDate(expense.getExpenseDate())
                    .totalExpenseAmount(expense.getAmount())
                    .paidByName(payerName)
                    .participantCount(expense.getParticipants() != null ? expense.getParticipants().size() : 0)
                    .myPaidAmount(myPaid)
                    .myShareAmount(myShare)
                    .netImpact(myShare.subtract(myPaid))
                    .build());
        }

        return BillBreakdownResponse.builder()
                .billId(bill.getId())
                .settlementId(settlement.getId())
                .month(settlement.getMonth())
                .year(settlement.getYear())
                .memberFullName(member != null ? member.getFullName() : "N/A")
                .memberEmail(member != null ? member.getEmail() : "N/A")
                .totalPaid(totalPaid)
                .totalOwed(totalOwed)
                .netAmount(bill.getAmount())
                .items(items)
                .build();
    }

    @Transactional
    public String cancelSettlement(UUID settlementId, String headEmail) {
        User head = userRepository.findByEmail(headEmail).orElseThrow(
                () -> new SettlementException("Hong tìm thấy Chủ hộ đâu ròi!"));

        Settlement settlement = settlementRepository.findById(settlementId).orElseThrow(
                () -> new SettlementException("Hong thấy kỳ chốt sổ này đâu hết á!"));

        if (head.getRole() != RoleEnum.HEAD || !head.getFamily().getId().equals(settlement.getFamilyId())) {
            throw new SettlementException("Chỉ Chủ hộ mới được hủy chốt sổ nha!");
        }

        boolean hasPayments = settlement.getSettlementBills().stream()
                .anyMatch(b -> b.getStatus() != SettlementBillStatusEnum.PENDING);

        if (hasPayments) {
            throw new SettlementException("Có người đóng tiền ròi, hong hủy kỳ chốt sổ này được nữa nha!");
        }

        expenseRepository.unlockExpensesBySettlementId(settlementId);

        settlementBillRepository.deleteAll(settlement.getSettlementBills());
        settlementRepository.delete(settlement);

        return "Hủy kỳ chốt sổ thành công! Dữ liệu đã được mở khóa.";
    }

    @Transactional
    public String remindPayment(UUID billId, String headEmail) {
        User head = userRepository.findByEmail(headEmail).orElseThrow(
                () -> new SettlementException("Hong tìm thấy Chủ hộ đâu ròi!"));

        SettlementBill bill = settlementBillRepository.findWithSettlementById(billId).orElseThrow(
                () -> new SettlementException("Hong thấy hóa đơn này đâu hết á!"));

        if (head.getRole() != RoleEnum.HEAD || !head.getFamily().getId().equals(bill.getSettlement().getFamilyId())) {
            throw new SettlementException("Chỉ Chủ hộ mới được bấm nhắc nợ nha!");
        }

        if (bill.getStatus() != SettlementBillStatusEnum.PENDING) {
            throw new SettlementException("Hóa đơn này đóng ròi hoặc đang chờ duyệt á, khỏi nhắc nữa nha!");
        }

        if (remindCooldownMinutes > 0) {
            LocalDateTime lastReminded = lastRemindedMap.get(billId);
            if (lastReminded != null && lastReminded.plusMinutes(remindCooldownMinutes).isAfter(LocalDateTime.now())) {
                long minutesRemaining = Math.max(1, Duration.between(LocalDateTime.now(), lastReminded.plusMinutes(remindCooldownMinutes)).toMinutes());
                throw new SettlementException(
                        "Từ từ nha, mỗi " + remindCooldownMinutes + " phút chỉ nhắc nợ được 1 lần thôi á, đợi thêm "
                                + minutesRemaining + " phút nữa rồi bấm lại nha!");
            }
        }

        User debtor = userRepository.findById(bill.getUserId()).orElseThrow(
                () -> new SettlementException("Hong tìm thấy người cần nhắc đâu ròi!"));

        sendRemindEmail(head, debtor, bill);

        if (remindCooldownMinutes > 0) {
            lastRemindedMap.put(billId, LocalDateTime.now());
        }

        return "Đã gửi email nhắc nhở thành công đến " + debtor.getFullName();
    }

    private void sendRemindEmail(User head, User debtor, SettlementBill bill) {
        int month = bill.getSettlement().getMonth();
        int year = bill.getSettlement().getYear();
        String deepLink = emailService.buildSettlementLink(month, year);
        String ctaHtml = buildDeepLinkButtonHtml(deepLink, "Mở FinFlow để nộp minh chứng");

        String memo = VietQrBuilder.buildTransferContent(month, year, debtor.getFullName(), false);
        String emailQrUrl = VietQrBuilder.buildEmailQrUrl(
                head.getBankCode(), head.getBankAccountNumber(), head.getBankAccountName(), bill.getAmount(), memo
        );
        String qrHtml = emailQrUrl != null ? buildEmailQrBlockHtml(emailQrUrl, head, memo) : "";

        String subject = "FinFlow | Nhắc nhở thanh toán công nợ tháng " + month + "/" + year;
        String body = String.format(
                "<html><body style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#172420;line-height:1.6;\">" +
                        "<h2>Nhắc nhở thanh toán công nợ</h2>" +
                        "<p>Chào <b>%s</b>,</p>" +
                        "<p>Chủ hộ <b>%s</b> đã gửi lời nhắc bạn tất toán khoản nợ của tháng <b>%d/%d</b>.</p>" +
                        "<p>Số tiền cần đóng: <b style=\"color:#b42318;\">%,.0f VND</b></p>" +
                        "%s" +
                        "<p>Vui lòng mở FinFlow để nộp minh chứng thanh toán sớm nhất có thể.</p>" +
                        "%s" +
                        "<hr/><p style=\"font-size:12px;color:#6c7f78;\"><i>Đây là email tự động từ hệ thống FinFlow.</i></p>" +
                        "</body></html>",
                debtor.getFullName(),
                head.getFullName(),
                month,
                year,
                bill.getAmount().abs(),
                qrHtml,
                ctaHtml);

        emailService.sendEmailAfterCommit(debtor.getEmail(), subject, body);
    }

    private BillDetail buildBillDetail(SettlementBill bill, User member, User head, Integer month, Integer year) {
        String memberName = member != null ? member.getFullName() : "N/A";
        String memberEmail = member != null ? member.getEmail() : "N/A";

        String qrImageUrl = null;
        String recipientBankCode = null;
        String recipientAccountNumber = null;
        String recipientAccountName = null;
        String transferContent = null;

        if (bill.getStatus() != SettlementBillStatusEnum.COMPLETED
                && bill.getAmount() != null
                && bill.getAmount().compareTo(BigDecimal.ZERO) != 0) {
            boolean isDebtor = bill.getAmount().compareTo(BigDecimal.ZERO) > 0;
            User recipient = isDebtor ? head : member;
            if (recipient != null && month != null && year != null) {
                transferContent = VietQrBuilder.buildTransferContent(month, year, memberName, !isDebtor);
                qrImageUrl = VietQrBuilder.buildWebQrUrl(
                        recipient.getBankCode(),
                        recipient.getBankAccountNumber(),
                        recipient.getBankAccountName(),
                        bill.getAmount(),
                        transferContent
                );
                if (qrImageUrl != null) {
                    recipientBankCode = recipient.getBankCode();
                    recipientAccountNumber = recipient.getBankAccountNumber();
                    recipientAccountName = recipient.getBankAccountName();
                }
            }
        }

        return BillDetail.builder()
                .id(bill.getId())
                .userEmail(memberEmail)
                .fullName(memberName)
                .amount(bill.getAmount())
                .status(bill.getStatus())
                .proofImageUrl(bill.getProofImageUrl())
                .month(month)
                .year(year)
                .qrImageUrl(qrImageUrl)
                .recipientBankCode(recipientBankCode)
                .recipientAccountNumber(recipientAccountNumber)
                .recipientAccountName(recipientAccountName)
                .transferContent(transferContent)
                .build();
    }

    private String buildDeepLinkButtonHtml(String deepLink, String label) {
        if (deepLink == null || deepLink.isBlank()) {
            return "";
        }
        return String.format(
                "<div style=\"margin:18px 0;\"><a href=\"%s\" style=\"display:inline-block;padding:12px 20px;background-color:#1b7352;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;\">%s</a></div>",
                deepLink, label
        );
    }

    private String buildEmailQrBlockHtml(String qrPngUrl, User recipient, String memo) {
        return String.format(
                "<div style=\"margin:18px 0;padding:16px;background-color:#f2f6f3;border:1px solid #d9dfd9;border-radius:12px;text-align:center;\">" +
                        "<p style=\"margin:0 0 10px;font-size:13px;font-weight:600;color:#172420;\">Quét mã VietQR để chuyển khoản nhanh</p>" +
                        "<img src=\"%s\" alt=\"Mã VietQR\" style=\"max-width:240px;width:100%%;height:auto;border-radius:8px;\" />" +
                        "<p style=\"margin:10px 0 0;font-size:12px;color:#354741;\"><b>%s</b> - %s (%s)<br/>Nội dung: <b>%s</b></p>" +
                        "</div>",
                qrPngUrl,
                recipient.getBankCode(),
                recipient.getBankAccountNumber(),
                recipient.getBankAccountName() != null ? recipient.getBankAccountName() : recipient.getFullName(),
                memo
        );
    }
}
