import { PdfStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => {
  return {
    reportFindUnique: vi.fn(),
    reportUpdate: vi.fn(),
  };
});

const pdfMocks = vi.hoisted(() => {
  return {
    generateReportPdf: vi.fn(),
    storeReportPdfInBlob: vi.fn(),
  };
});

vi.mock("../../lib/db/prisma", () => ({
  prisma: {
    report: {
      findUnique: prismaMocks.reportFindUnique,
      update: prismaMocks.reportUpdate,
    },
  },
}));

vi.mock("../../lib/report/pdf", () => ({
  generateReportPdf: pdfMocks.generateReportPdf,
  storeReportPdfInBlob: pdfMocks.storeReportPdfInBlob,
}));

import { GET } from "../../app/api/report/pdf/[token]/route";

describe("GET /api/report/pdf/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    prismaMocks.reportUpdate.mockResolvedValue({});
  });

  it("returns 404 when report token does not exist", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/report/pdf/missing"), {
      params: Promise.resolve({ token: "missing" }),
    });
    const body = (await response.json()) as { message?: string };

    expect(response.status).toBe(404);
    expect(body.message).toBe("Report not found for provided token.");
    expect(pdfMocks.generateReportPdf).not.toHaveBeenCalled();
    expect(prismaMocks.reportUpdate).not.toHaveBeenCalled();
  });

  it("returns PDF bytes with headers when generation succeeds", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue({
      id: "report_id_1",
      reportToken: "report-token-1",
      reportUrlPath: "/report/report-token-1",
      submission: {
        childName: "Child One",
      },
    });
    pdfMocks.generateReportPdf.mockResolvedValue(Buffer.from("pdf-content"));
    pdfMocks.storeReportPdfInBlob.mockResolvedValue(
      "https://blob.vercel-storage.com/reports/report-token-1.pdf",
    );

    const response = await GET(new Request("http://localhost/api/report/pdf/report-token-1"), {
      params: Promise.resolve({ token: "report-token-1" }),
    });
    const bytes = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain(
      "Child_One_Learning_Skills_Checkup.pdf",
    );
    expect(response.headers.get("X-Report-Pdf-Blob-Url")).toBe(
      "https://blob.vercel-storage.com/reports/report-token-1.pdf",
    );
    expect(bytes.toString()).toBe("pdf-content");
    expect(pdfMocks.generateReportPdf).toHaveBeenCalledWith({
      reportUrl: "http://localhost:3000/report/report-token-1",
    });
    expect(pdfMocks.storeReportPdfInBlob).toHaveBeenCalledWith({
      reportToken: "report-token-1",
      pdfBytes: Buffer.from("pdf-content"),
    });
    expect(prismaMocks.reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: expect.any(String) },
        data: expect.objectContaining({
          pdfStatus: PdfStatus.GENERATED,
          pdfBlobUrl: "https://blob.vercel-storage.com/reports/report-token-1.pdf",
        }),
      }),
    );
  });

  it("returns 500 and marks FAILED when PDF generation fails", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue({
      id: "report_id_2",
      reportToken: "report-token-2",
      reportUrlPath: "/report/report-token-2",
      submission: {
        childName: "Child Two",
      },
    });
    pdfMocks.generateReportPdf.mockRejectedValue(new Error("Chrome executable not found."));

    const response = await GET(new Request("http://localhost/api/report/pdf/report-token-2"), {
      params: Promise.resolve({ token: "report-token-2" }),
    });
    const body = (await response.json()) as { message?: string };

    expect(response.status).toBe(500);
    expect(body.message).toBe("Chrome executable not found.");
    expect(prismaMocks.reportUpdate).toHaveBeenCalledWith({
      where: { id: "report_id_2" },
      data: {
        pdfStatus: PdfStatus.FAILED,
      },
    });
  });

  it("returns 500 and marks FAILED when Blob upload fails", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue({
      id: "report_id_3",
      reportToken: "report-token-3",
      reportUrlPath: "/report/report-token-3",
      submission: {
        childName: "Child Three",
      },
    });
    pdfMocks.generateReportPdf.mockResolvedValue(Buffer.from("pdf-content-3"));
    pdfMocks.storeReportPdfInBlob.mockRejectedValue(
      new Error("Missing required environment variable: BLOB_READ_WRITE_TOKEN"),
    );

    const response = await GET(new Request("http://localhost/api/report/pdf/report-token-3"), {
      params: Promise.resolve({ token: "report-token-3" }),
    });
    const body = (await response.json()) as { message?: string };

    expect(response.status).toBe(500);
    expect(body.message).toBe(
      "Missing required environment variable: BLOB_READ_WRITE_TOKEN",
    );
    expect(prismaMocks.reportUpdate).toHaveBeenCalledWith({
      where: { id: "report_id_3" },
      data: {
        pdfStatus: PdfStatus.FAILED,
      },
    });
  });

  it("returns actionable guidance when Blob store is not provisioned", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue({
      id: "report_id_4",
      reportToken: "report-token-4",
      reportUrlPath: "/report/report-token-4",
      submission: {
        childName: "Child Four",
      },
    });
    pdfMocks.generateReportPdf.mockResolvedValue(Buffer.from("pdf-content-4"));
    pdfMocks.storeReportPdfInBlob.mockRejectedValue(
      new Error("Vercel Blob: This store does not exist."),
    );

    const response = await GET(new Request("http://localhost/api/report/pdf/report-token-4"), {
      params: Promise.resolve({ token: "report-token-4" }),
    });
    const body = (await response.json()) as { message?: string };

    expect(response.status).toBe(500);
    expect(body.message).toBe(
      "Vercel Blob store is not available for the current BLOB_READ_WRITE_TOKEN. Create/connect a Blob store in Vercel, generate a new read-write token, and update BLOB_READ_WRITE_TOKEN in .env.local.",
    );
    expect(prismaMocks.reportUpdate).toHaveBeenCalledWith({
      where: { id: "report_id_4" },
      data: {
        pdfStatus: PdfStatus.FAILED,
      },
    });
  });

  it("supports retry by marking FAILED first and GENERATED on the next successful call", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue({
      id: "report_id_5",
      reportToken: "report-token-5",
      reportUrlPath: "/report/report-token-5",
      submission: {
        childName: "Child Five",
      },
    });
    pdfMocks.generateReportPdf.mockResolvedValue(Buffer.from("pdf-content-5"));
    pdfMocks.storeReportPdfInBlob
      .mockRejectedValueOnce(new Error("Temporary upload failure"))
      .mockResolvedValueOnce("https://blob.vercel-storage.com/reports/report-token-5.pdf");

    const firstResponse = await GET(
      new Request("http://localhost/api/report/pdf/report-token-5"),
      {
        params: Promise.resolve({ token: "report-token-5" }),
      },
    );
    const secondResponse = await GET(
      new Request("http://localhost/api/report/pdf/report-token-5"),
      {
        params: Promise.resolve({ token: "report-token-5" }),
      },
    );

    expect(firstResponse.status).toBe(500);
    expect(secondResponse.status).toBe(200);
    expect(prismaMocks.reportUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: "report_id_5" },
      data: {
        pdfStatus: PdfStatus.FAILED,
      },
    });
    expect(prismaMocks.reportUpdate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: "report_id_5" },
        data: expect.objectContaining({
          pdfStatus: PdfStatus.GENERATED,
          pdfBlobUrl: "https://blob.vercel-storage.com/reports/report-token-5.pdf",
          pdfGeneratedAt: expect.any(Date),
        }),
      }),
    );
  });
});
