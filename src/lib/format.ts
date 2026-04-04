/**
 * Formats a number as Indian Rupee currency string.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats an ISO date string for display.
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

/**
 * Formats a timestamp for display.
 */
export function formatTimestamp(timestamp: number | string | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
