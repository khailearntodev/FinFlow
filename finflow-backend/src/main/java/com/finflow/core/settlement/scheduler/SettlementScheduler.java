package com.finflow.core.settlement.scheduler;

import com.finflow.core.enums.RoleEnum;
import com.finflow.core.exception.SettlementException;
import com.finflow.core.family.domain.Family;
import com.finflow.core.family.domain.User;
import com.finflow.core.family.repository.FamilyRepository;
import com.finflow.core.notification.service.EmailService;
import com.finflow.core.settlement.dto.SettlementCreateRequest;
import com.finflow.core.settlement.repository.SettlementRepository;
import com.finflow.core.settlement.service.SettlementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SettlementScheduler {
    static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final FamilyRepository familyRepository;
    private final SettlementRepository settlementRepository;
    private final SettlementService settlementService;
    private final EmailService emailService;

    /**
     * Tự động chốt sổ lúc 00:00 (giờ Việt Nam) vào ngày billingDate hàng tháng.
     */
    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Ho_Chi_Minh")
    public void autoCreateSettlement() {
        runAutoCreateSettlement(LocalDate.now(VIETNAM_ZONE));
    }

    /**
     * Gửi email nhắc Chủ hộ trước thời điểm tự động kết sổ đúng 1 ngày 12 tiếng (36 giờ).
     * Ví dụ: Kết sổ lúc 00:00 ngày 10 -> gửi nhắc lúc 12:00 trưa ngày 8 (tránh gửi giữa khuya).
     */
    @Scheduled(cron = "0 0 12 * * *", zone = "Asia/Ho_Chi_Minh")
    public void sendPreSettlementReminder() {
        runPreSettlementReminder(LocalDate.now(VIETNAM_ZONE));
    }

    void runAutoCreateSettlement(LocalDate today) {
        log.info("Bắt đầu chạy tự động kết sổ cho ngày {} (Asia/Ho_Chi_Minh)...", today);

        int currentDay = today.getDayOfMonth();
        LocalDate lastMonthDate = today.minusMonths(1);
        int settleMonth = lastMonthDate.getMonthValue();
        int settleYear = lastMonthDate.getYear();

        List<Family> familiesToSettle = familyRepository.findByBillingDate(currentDay);
        if (familiesToSettle.isEmpty()) {
            log.info("Không tìm thấy gia đình cần chốt sổ vào ngày {}", currentDay);
            return;
        }

        log.info("Tìm thấy {} gia đình cần chốt sổ hôm nay.", familiesToSettle.size());

        for (Family family : familiesToSettle) {
            try {
                User head = getFamilyHead(family);
                SettlementCreateRequest request = SettlementCreateRequest.builder()
                        .month(settleMonth)
                        .year(settleYear)
                        .holdEmail(head.getEmail())
                        .familyId(String.valueOf(family.getId()))
                        .build();

                settlementService.createSettlement(request);
                log.info("Tự động chạy chốt sổ thành công cho gia đình {}", family.getName());
            } catch (Exception e) {
                log.error(">>> LỖI khi chốt sổ tự động cho Gia đình {}: {}", family.getName(), e.getMessage(), e);
            }
        }

        log.info("Đã hoàn tất chốt sổ tự động!");
    }

    void runPreSettlementReminder(LocalDate today) {
        // 12:00 hôm nay + 36 tiếng = 00:00 ngày (today + 2 ngày)
        LocalDate targetBillingDate = today.plusDays(2);
        int targetBillingDay = targetBillingDate.getDayOfMonth();

        LocalDate settlePeriod = targetBillingDate.minusMonths(1);
        int settleMonth = settlePeriod.getMonthValue();
        int settleYear = settlePeriod.getYear();

        List<Family> upcomingFamilies = familyRepository.findByBillingDate(targetBillingDay);
        if (upcomingFamilies.isEmpty()) {
            log.info("Không có gia đình nào chốt sổ vào ngày {} (nhắc trước 1 ngày 12 tiếng).", targetBillingDate);
            return;
        }

        log.info("Gửi email nhắc trước kỳ chốt sổ ngày {} cho {} gia đình.", targetBillingDate, upcomingFamilies.size());

        for (Family family : upcomingFamilies) {
            try {
                boolean alreadySettled = settlementRepository
                        .findByFamilyIdAndMonthAndYear(family.getId(), settleMonth, settleYear)
                        .isPresent();
                if (alreadySettled) {
                    log.info("Gia đình {} đã chốt sổ tháng {}/{}, bỏ qua email nhắc.", family.getName(), settleMonth, settleYear);
                    continue;
                }

                User head = getFamilyHead(family);
                String subject = String.format(
                        "FinFlow | Nhắc lịch chốt sổ tháng %d/%d cho %s (còn 1 ngày 12 tiếng)",
                        settleMonth, settleYear, family.getName()
                );

                String body = buildPreSettlementReminderHtml(
                        head.getFullName(),
                        family.getName(),
                        settleMonth,
                        settleYear,
                        targetBillingDate
                );

                emailService.sendEmail(head.getEmail(), subject, body);
                log.info("Đã gửi email nhắc chốt sổ cho chủ hộ {} ({}) của gia đình {}", head.getFullName(), head.getEmail(), family.getName());
            } catch (Exception e) {
                log.error(">>> LỖI khi gửi email nhắc chốt sổ cho Gia đình {}: {}", family.getName(), e.getMessage(), e);
            }
        }
    }

    String buildPreSettlementReminderHtml(
            String headFullName,
            String familyName,
            int settleMonth,
            int settleYear,
            LocalDate targetBillingDate
    ) {
        String formattedDate = targetBillingDate.format(DATE_FORMATTER);
        String deepLink = emailService.buildSettlementLink(settleMonth, settleYear);
        String ctaHtml = deepLink != null
                ? String.format(
                "<div style=\"margin:0 0 22px;\"><a href=\"%s\" style=\"display:inline-block;padding:12px 20px;background-color:#1b7352;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;\">Mở FinFlow kiểm tra sổ chi tiêu</a></div>",
                deepLink
        )
                : "";
        return String.format(
                "<!DOCTYPE html>" +
                "<html lang=\"vi\"><body style=\"margin:0;padding:24px;background-color:#f6f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#172420;\">" +
                "<div style=\"max-width:560px;margin:0 auto;background-color:#ffffff;border:1px solid #d9dfd9;border-radius:14px;overflow:hidden;\">" +
                "  <div style=\"background-color:#15241f;padding:24px 28px;color:#f6f5f0;\">" +
                "    <p style=\"margin:0;font-size:13px;color:#9eb5ab;\">FinFlow | Nhắc lịch chốt sổ định kỳ</p>" +
                "    <h1 style=\"margin:8px 0 0;font-size:22px;line-height:1.3;color:#ffffff;\">Sắp đến kỳ chốt sổ tháng %d/%d</h1>" +
                "  </div>" +
                "  <div style=\"padding:28px;\">" +
                "    <p style=\"margin:0 0 16px;font-size:15px;line-height:1.6;\">Chào <b>%s</b>,</p>" +
                "    <p style=\"margin:0 0 20px;font-size:15px;line-height:1.6;color:#354741;\">" +
                "      Hệ thống FinFlow sẽ tự động chốt sổ và khóa các khoản chi tiêu của gia đình <b>%s</b> sau <b>1 ngày 12 tiếng</b> nữa." +
                "    </p>" +
                "    <table style=\"width:100%%;border-collapse:collapse;background-color:#f2f6f3;border:1px solid #d9dfd9;border-radius:10px;margin-bottom:20px;\">" +
                "      <tr><td style=\"padding:12px 16px;font-size:13px;color:#556b63;border-bottom:1px solid #d9dfd9;\">Gia đình</td><td style=\"padding:12px 16px;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #d9dfd9;\">%s</td></tr>" +
                "      <tr><td style=\"padding:12px 16px;font-size:13px;color:#556b63;border-bottom:1px solid #d9dfd9;\">Kỳ chốt sổ</td><td style=\"padding:12px 16px;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #d9dfd9;\">Tháng %d/%d</td></tr>" +
                "      <tr><td style=\"padding:12px 16px;font-size:13px;color:#556b63;\">Thời điểm tự động khóa sổ</td><td style=\"padding:12px 16px;font-size:14px;font-weight:700;color:#1b7352;text-align:right;\">00:00 ngày %s</td></tr>" +
                "    </table>" +
                "    <p style=\"margin:0 0 10px;font-size:14px;font-weight:600;color:#172420;\">Lưu ý cho Chủ hộ trước khi khóa sổ:</p>" +
                "    <ul style=\"margin:0 0 22px;padding-left:20px;font-size:14px;line-height:1.7;color:#354741;\">" +
                "      <li>Kiểm tra lại các khoản chi trong tháng %d/%d đã được ghi nhận đầy đủ.</li>" +
                "      <li>Nhắc các thành viên cập nhật hoặc chỉnh sửa khoản chi còn thiếu trước 00:00 ngày %s.</li>" +
                "      <li>Sau thời điểm trên, các khoản chi sẽ tự động chuyển sang trạng thái <b>Đã chốt</b> và tạo hóa đơn công nợ.</li>" +
                "    </ul>" +
                "    %s" +
                "    <p style=\"margin:0;padding-top:16px;border-top:1px solid #e5eae5;font-size:12px;color:#6c7f78;\">" +
                "      Đây là email tự động từ hệ thống FinFlow. Nếu bạn đã chủ động chốt sổ sớm hơn, vui lòng bỏ qua thông báo này." +
                "    </p>" +
                "  </div>" +
                "</div>" +
                "</body></html>",
                settleMonth, settleYear,
                headFullName,
                familyName,
                familyName,
                settleMonth, settleYear,
                formattedDate,
                settleMonth, settleYear,
                formattedDate,
                ctaHtml
        );
    }

    private User getFamilyHead(Family family) {
        if (family.getMembers() == null || family.getMembers().isEmpty()) {
            throw new SettlementException("Ủa nhà " + family.getName() + " hong thấy ai hết á!");
        }
        return family.getMembers().stream()
                .filter(m -> m.getRole() == RoleEnum.HEAD)
                .findFirst()
                .orElseThrow(() -> new SettlementException("Hong tìm thấy Chủ hộ của nhà này đâu ròi!"));
    }
}
