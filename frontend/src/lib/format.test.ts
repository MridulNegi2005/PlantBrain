import { describe, expect, it } from "vitest"

import { parseApiDate } from "@/lib/format"

describe("parseApiDate", () => {
  it("treats timezone-less API datetimes as UTC", () => {
    expect(parseApiDate("2026-07-17T08:35:11").toISOString()).toBe(
      "2026-07-17T08:35:11.000Z"
    )
  })

  it("preserves explicit timezone offsets", () => {
    expect(parseApiDate("2026-07-17T14:05:11+05:30").toISOString()).toBe(
      "2026-07-17T08:35:11.000Z"
    )
  })

  it("keeps date-only values valid", () => {
    expect(parseApiDate("2026-07-17").toISOString()).toBe(
      "2026-07-17T00:00:00.000Z"
    )
  })
})
