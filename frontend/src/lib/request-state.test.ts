import { describe, expect, it } from "vitest"

import {
  idleRequestState,
  requestStateReducer,
  type RequestState,
} from "@/lib/request-state"

describe("latest request state", () => {
  it("starts without result data or an error", () => {
    expect(idleRequestState()).toEqual({
      status: "idle",
      data: null,
      error: null,
    })
  })

  it("clears a previous result as soon as a new request starts", () => {
    const previous: RequestState<{ asset: string }> = {
      status: "success",
      data: { asset: "P-204A" },
      error: null,
    }

    expect(requestStateReducer(previous, { type: "start" })).toEqual({
      status: "loading",
      data: null,
      error: null,
    })
  })

  it("never restores stale data when the replacement request fails", () => {
    const loading: RequestState<{ asset: string }> = {
      status: "loading",
      data: null,
      error: null,
    }

    expect(
      requestStateReducer(loading, {
        type: "fail",
        error: "Asset P-999 not found.",
      })
    ).toEqual({
      status: "error",
      data: null,
      error: "Asset P-999 not found.",
    })
  })

  it("stores only the latest successful result", () => {
    const loading: RequestState<{ asset: string }> = {
      status: "loading",
      data: null,
      error: null,
    }

    expect(
      requestStateReducer(loading, {
        type: "succeed",
        data: { asset: "HX-102" },
      })
    ).toEqual({
      status: "success",
      data: { asset: "HX-102" },
      error: null,
    })
  })
})
