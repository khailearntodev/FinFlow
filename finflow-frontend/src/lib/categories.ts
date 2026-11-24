export const EXPENSE_CATEGORIES = [
  { value: 'FOOD_GROCERIES', label: 'Đi chợ & Ăn uống' },
  { value: 'UTILITIES', label: 'Điện, Nước & Internet' },
  { value: 'HOUSING', label: 'Tiền nhà & Phí quản lý' },
  { value: 'HOUSEHOLD', label: 'Đồ dùng gia đình' },
  { value: 'TRANSPORT', label: 'Di chuyển' },
  { value: 'ENTERTAINMENT', label: 'Giải trí' },
  { value: 'HEALTH', label: 'Y tế & Sức khỏe' },
  { value: 'OTHER', label: 'Khác' },
] as const;

export type ExpenseCategoryValue = (typeof EXPENSE_CATEGORIES)[number]['value'];

export function getCategoryLabel(category?: string | null): string {
  const found = EXPENSE_CATEGORIES.find((c) => c.value === category);
  return found ? found.label : 'Khác';
}
