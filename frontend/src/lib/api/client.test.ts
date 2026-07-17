import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  API_URL,
  ApiError,
  askCopilot,
  checkCompliance,
  findSimilarLessons,
  generateRca,
  getAsset,
  getAssetGraph,
  getAssetTimeline,
  getAssets,
  getAuditLogs,
  getDocuments,
  getDocument,
  getDocumentChunks,
  getEvaluationCases,
  getEvaluationRun,
  getLatestEvaluationRun,
  getHealth,
  getIngestionJob,
  getSecurityEvents,
  ingestDocument,
  startEvaluation,
  uploadDocument,
} from "@/lib/api/client"

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => jsonResponse({ items: [] }))
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("PlantBrain API client", () => {
  it("uses the configured API origin and disables response caching", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "ok" }))

    await getHealth()

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/health`, {
      cache: "no-store",
      headers: {},
    })
  })

  it("preserves document query parameters", async () => {
    const query = new URLSearchParams({ status: "completed", type: "Work Order" })

    await getDocuments(query)

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${API_URL}/api/documents?status=completed&type=Work+Order`
    )
  })

  it("encodes identifiers placed in request paths", async () => {
    await getDocument("doc/42")
    await getDocumentChunks("doc/42")
    await getAsset("P/204 A")
    await getAssetTimeline("P/204 A")
    await getAssetGraph("P/204 A")
    await ingestDocument("doc/42")
    await getIngestionJob("job/42")
    await getEvaluationRun("run/42")

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${API_URL}/api/documents/doc%2F42`,
      `${API_URL}/api/documents/doc%2F42/chunks`,
      `${API_URL}/api/assets/P%2F204%20A`,
      `${API_URL}/api/assets/P%2F204%20A/timeline`,
      `${API_URL}/api/assets/P%2F204%20A/graph`,
      `${API_URL}/api/documents/doc%2F42/ingest`,
      `${API_URL}/api/ingestion-jobs/job%2F42`,
      `${API_URL}/api/evaluation/runs/run%2F42`,
    ])
  })

  it("sends uploads as multipart data without overriding the boundary", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ document_id: "doc_1" }))
    const file = new File(["plant evidence"], "WO-129.txt", {
      type: "text/plain",
    })

    await uploadDocument(file, "plant_shakti")

    const [, init] = fetchMock.mock.calls[0] ?? []
    expect(init?.method).toBe("POST")
    expect(init?.headers).toEqual({})
    expect(init?.body).toBeInstanceOf(FormData)

    const formData = init?.body as FormData
    expect(formData.get("file")).toBe(file)
    expect(formData.get("plant_id")).toBe("plant_shakti")
  })

  it.each([
    {
      name: "copilot",
      call: () => askCopilot("Why did it fail?", "P-204A"),
      path: "/api/copilot/ask",
      body: { question: "Why did it fail?", asset_tag: "P-204A" },
    },
    {
      name: "RCA",
      call: () => generateRca("P-204A", "Repeated seal leak"),
      path: "/api/rca/generate",
      body: { asset_tag: "P-204A", issue: "Repeated seal leak" },
    },
    {
      name: "compliance",
      call: () => checkCompliance("V-301"),
      path: "/api/compliance/check",
      body: { asset_tag: "V-301" },
    },
    {
      name: "similar lessons",
      call: () => findSimilarLessons("seal leakage"),
      path: "/api/lessons/similar",
      body: { failure_mode: "seal leakage" },
    },
  ])("serializes the $name request contract", async ({ call, path, body }) => {
    await call()

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}${path}`, {
      cache: "no-store",
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    })
  })

  it("omits an empty optional asset scope from copilot requests", async () => {
    await askCopilot("What needs attention?")

    const [, init] = fetchMock.mock.calls[0] ?? []
    expect(JSON.parse(String(init?.body))).toEqual({
      question: "What needs attention?",
    })
  })

  it("covers every read-only registry endpoint", async () => {
    await getAssets()
    await getEvaluationCases()
    await getAuditLogs()
    await getSecurityEvents()
    await getLatestEvaluationRun()

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${API_URL}/api/assets`,
      `${API_URL}/api/evaluation/cases`,
      `${API_URL}/api/audit-logs`,
      `${API_URL}/api/security-events`,
      `${API_URL}/api/evaluation/runs`,
    ])
  })

  it("starts evaluation runs with the documented POST request", async () => {
    await startEvaluation()

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/api/evaluation/run`, {
      cache: "no-store",
      method: "POST",
      headers: {},
    })
  })

  it("surfaces structured backend errors with status and code", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code: "asset_not_found",
            message: "Asset P-999 was not found",
          },
        },
        404
      )
    )

    await expect(getAsset("P-999")).rejects.toMatchObject({
      name: "ApiError",
      message: "Asset P-999 was not found",
      status: 404,
      code: "asset_not_found",
    } satisfies Partial<ApiError>)
  })

  it("unwraps FastAPI HTTPException error details", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          detail: {
            error: {
              code: "not_found",
              message: "Document doc_missing not found.",
            },
          },
        },
        404
      )
    )

    await expect(getDocument("doc_missing")).rejects.toMatchObject({
      name: "ApiError",
      message: "Document doc_missing not found.",
      status: 404,
      code: "not_found",
    } satisfies Partial<ApiError>)
  })

  it("falls back to the HTTP status when an error body is not JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("gateway unavailable", { status: 502 })
    )

    await expect(getDocuments()).rejects.toEqual(
      new ApiError("Request failed with status 502", 502)
    )
  })
})
