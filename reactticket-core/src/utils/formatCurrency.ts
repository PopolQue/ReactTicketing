export function formatCurrency(
  cents: number,
  currency: string,
  locale?: string
): string {
  return new Intl.NumberFormat(locale ?? "en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
