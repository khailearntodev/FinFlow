package com.finflow.core.settlement.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class VietQrBuilderTest {

    @Test
    @DisplayName("toAscii converts Vietnamese diacritics including đ/Đ cleanly")
    void toAscii_convertsVietnameseCharacters() {
        assertThat(VietQrBuilder.toAscii("Phạm Công Đạt")).isEqualTo("Pham Cong Dat");
        assertThat(VietQrBuilder.toAscii("Nguyễn Quang Khải")).isEqualTo("Nguyen Quang Khai");
    }

    @Test
    @DisplayName("buildWebQrUrl generates compact2.svg VietQR QuickLink with encoded params")
    void buildWebQrUrl_validInputs_returnsSvgQuickLink() {
        String memo = VietQrBuilder.buildTransferContent(10, 2026, "Nguyễn Quang Khải", false);
        String url = VietQrBuilder.buildWebQrUrl(
                "mb", "0123456789", "Pham Cong Dat", new BigDecimal("485983.00"), memo
        );

        assertThat(url).startsWith("https://img.vietqr.io/image/MB-0123456789-compact2.svg?");
        assertThat(url).contains("amount=485983");
        assertThat(url).contains("addInfo=FinFlow+T10+2026+Nguyen+Quang+Khai");
        assertThat(url).contains("accountName=PHAM+CONG+DAT");
    }

    @Test
    @DisplayName("buildEmailQrUrl generates compact2.png for email client compatibility")
    void buildEmailQrUrl_validInputs_returnsPngQuickLink() {
        String url = VietQrBuilder.buildEmailQrUrl(
                "MB", "0123456789", "PHAM CONG DAT", new BigDecimal("-1268417"), "FinFlow Hoan T10 2026"
        );

        assertThat(url).startsWith("https://img.vietqr.io/image/MB-0123456789-compact2.png?");
        assertThat(url).contains("amount=1268417");
    }

    @Test
    @DisplayName("buildWebQrUrl returns null when bank info or amount is missing/zero")
    void buildWebQrUrl_missingOrZero_returnsNull() {
        assertThat(VietQrBuilder.buildWebQrUrl(null, "0123456789", "NAME", new BigDecimal("10000"), "memo")).isNull();
        assertThat(VietQrBuilder.buildWebQrUrl("MB", "", "NAME", new BigDecimal("10000"), "memo")).isNull();
        assertThat(VietQrBuilder.buildWebQrUrl("MB", "0123456789", "NAME", BigDecimal.ZERO, "memo")).isNull();
    }
}
