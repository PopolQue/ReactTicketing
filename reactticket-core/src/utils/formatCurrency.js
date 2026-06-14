export function formatCurrency(cents, currency, locale) {
    return new Intl.NumberFormat(locale ?? "en-US", {
        style: "currency",
        currency,
    }).format(cents / 100);
}
