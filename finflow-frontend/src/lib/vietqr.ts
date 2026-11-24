export function toVietQrPngUrl(qrUrl?: string | null): string | null {
  if (!qrUrl) return null;
  return qrUrl.replace('-compact2.svg', '-compact2.png');
}

export function buildVietQrImageUrl(params: {
  bankCode?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  format?: 'svg' | 'png';
}): string | null {
  const { bankCode, accountNumber, accountName, format = 'svg' } = params;
  const cleanBank = bankCode?.trim().toUpperCase();
  const cleanAccount = accountNumber?.trim().replace(/\s+/g, '');
  if (!cleanBank || !cleanAccount) return null;

  const base = `https://img.vietqr.io/image/${encodeURIComponent(cleanBank)}-${encodeURIComponent(cleanAccount)}-compact2.${format}`;
  const cleanName = accountName?.trim();
  if (!cleanName) return base;

  const search = new URLSearchParams({ accountName: cleanName });
  return `${base}?${search.toString()}`;
}
