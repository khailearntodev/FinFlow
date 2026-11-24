package com.finflow.core.settlement.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;

public final class VietQrBuilder {
    private static final String BASE_URL = "https://img.vietqr.io/image/";
    private static final int MAX_MEMO_LENGTH = 50;

    private VietQrBuilder() {
    }

    public static String buildTransferContent(int month, int year, String memberFullName, boolean isRefund) {
        String normalizedName = toAscii(memberFullName != null ? memberFullName : "");
        String prefix = isRefund
                ? String.format("FinFlow Hoan T%d %d", month, year)
                : String.format("FinFlow T%d %d", month, year);
        String raw = normalizedName.isBlank() ? prefix : prefix + " " + normalizedName;
        if (raw.length() > MAX_MEMO_LENGTH) {
            return raw.substring(0, MAX_MEMO_LENGTH).trim();
        }
        return raw;
    }

    public static String buildWebQrUrl(
            String bankCode,
            String accountNumber,
            String accountName,
            BigDecimal amount,
            String memo
    ) {
        return buildQrUrl(bankCode, accountNumber, accountName, amount, memo, "svg");
    }

    public static String buildEmailQrUrl(
            String bankCode,
            String accountNumber,
            String accountName,
            BigDecimal amount,
            String memo
    ) {
        return buildQrUrl(bankCode, accountNumber, accountName, amount, memo, "png");
    }

    private static String buildQrUrl(
            String bankCode,
            String accountNumber,
            String accountName,
            BigDecimal amount,
            String memo,
            String extension
    ) {
        if (bankCode == null || bankCode.isBlank() || accountNumber == null || accountNumber.isBlank()) {
            return null;
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }

        long roundedAmount = amount.abs().setScale(0, RoundingMode.HALF_UP).longValue();
        if (roundedAmount <= 0) {
            return null;
        }

        String cleanBank = bankCode.trim().toUpperCase();
        String cleanAccount = accountNumber.trim().replaceAll("\\s+", "");

        StringBuilder sb = new StringBuilder(BASE_URL)
                .append(urlEncode(cleanBank))
                .append('-')
                .append(urlEncode(cleanAccount))
                .append("-compact2.")
                .append(extension)
                .append("?amount=")
                .append(roundedAmount);

        if (memo != null && !memo.isBlank()) {
            sb.append("&addInfo=").append(urlEncode(toAscii(memo)));
        }

        if (accountName != null && !accountName.isBlank()) {
            sb.append("&accountName=").append(urlEncode(toAscii(accountName).toUpperCase()));
        }

        return sb.toString();
    }

    public static String toAscii(String input) {
        if (input == null) return "";
        String replaced = input.replace('đ', 'd').replace('Đ', 'D');
        String normalized = Normalizer.normalize(replaced, Normalizer.Form.NFD);
        return normalized
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("[^A-Za-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
