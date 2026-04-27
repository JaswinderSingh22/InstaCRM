export function formatMoney(cents: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.length === 3 ? currency : "USD",
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

/** Major units (e.g. chart tooltips) with workspace currency. */
export function formatMajorUnitsAmount(n: number, currency = "USD") {
  const code = currency.length === 3 ? currency : "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${code} ${n}`;
  }
}

export function formatMajorUnitsCompact(n: number, currency = "USD") {
  const code = currency.length === 3 ? currency : "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return `${n} ${code}`;
  }
}

export function currencySymbol(isoCode: string): string {
  const code = isoCode.length === 3 ? isoCode : "USD";
  try {
    const parts = new Intl.NumberFormat(undefined, { style: "currency", currency: code }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}
