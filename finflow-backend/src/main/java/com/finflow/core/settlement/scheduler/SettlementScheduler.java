package com.finflow.core.settlement.scheduler;

import com.finflow.core.enums.RoleEnum;
import com.finflow.core.exception.SettlementException;
import com.finflow.core.family.domain.Family;
import com.finflow.core.family.repository.FamilyRepository;
import com.finflow.core.settlement.dto.SettlementCreateRequest;
import com.finflow.core.settlement.service.SettlementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SettlementScheduler {
    private final FamilyRepository familyRepository;
    private final SettlementService settlementService;

    @Scheduled(cron = "0 0 0 * * *")
    //@Scheduled(fixedRate = 10000)
    public void autoCreateSettlement() {
        log.info("Bắt đầu chạy tự động kết sổ...");

        LocalDate today = LocalDate.now();
        int currentDay = today.getDayOfMonth();
        
        // Chốt sổ cho tháng trước đó
        LocalDate lastMonthDate = today.minusMonths(1);
        int settleMonth = lastMonthDate.getMonthValue();
        int settleYear = lastMonthDate.getYear();

        List<Family> familiesToSettle = familyRepository.findByBillingDate(currentDay);
        if (familiesToSettle.isEmpty()) {
            log.info("Không tìm thấy gia đình cần chốt sổ vào ngày " + currentDay);
            return;
        }

        log.info("Tìm thấy {} gia đình cần chốt sổ hôm nay: ", familiesToSettle.size());

        for (Family family : familiesToSettle) {
            try {
                SettlementCreateRequest request = SettlementCreateRequest.builder()
                        .month(settleMonth)
                        .year(settleYear)
                        .holdEmail(getHeadEmail(family))
                        .familyId(String.valueOf(family.getId()))
                        .build();

                settlementService.createSettlement(request);
                log.info("Tự động chạy chốt sổ thành công cho gia đình " + family.getName());
            } catch (Exception e) {
                log.error(">>> LỖI khi chốt sổ tự động cho Gia đình {}: {}", family.getName(), e.getMessage());
            }
        }

        log.info("Đã hoàn tất chốt sổ tự động!");
    }

    private String getHeadEmail(Family family) {
        return family.getMembers().stream()
                .filter(m -> m.getRole() == RoleEnum.HEAD)
                .findFirst()
                .orElseThrow(() -> new SettlementException("Không tìm thấy chủ hộ"))
                .getEmail();
    }
}
