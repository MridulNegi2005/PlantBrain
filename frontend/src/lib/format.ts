export function parseApiDate(value: string) {
  const hasExplicitTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
  const normalized = value.includes("T") && !hasExplicitTimezone
    ? `${value}Z`
    : value
  return new Date(normalized)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseApiDate(value))
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parseApiDate(value))
}

export function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function percent(value: number) {
  return `${Math.round(value * 100)}%`
}
