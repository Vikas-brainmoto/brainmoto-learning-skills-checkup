import { ReportEmailStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => {
  return {
    reportFindUnique: vi.fn(),
    reportUpdate: vi.fn(),
  };
});

const emailMocks = vi.hoisted(() => {
  return {
    sendReportEmail: vi.fn(),
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

vi.mock("../../lib/email/resend", () => ({
  sendReportEmail: emailMocks.sendReportEmail,
}));

import { POST } from "../../app/api/report/send/[token]/route";

describe("POST /api/report/send/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("returns 404 when report token is not found", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost/api/report/send/missing"), {
      params: Promise.resolve({ token: "missing" }),
    });
    const body = (await response.json()) as { message?: string };

    expect(response.status).toBe(404);
    expect(body.message).toBe("Report not found for provided token.");
    expect(prismaMocks.reportUpdate).not.toHaveBeenCalled();
  });

  it("sends email and marks report as SENT on success", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue({
      id: "report_1",
      reportToken: "report-token-1",
      reportUrlPath: "/report/report-token-1",
      emailStatus: ReportEmailStatus.PENDING,
      submission: {
        parentEmail: "parent@example.com",
        parentName: "Parent One",
        childName: "Child One",
      },
    });
    emailMocks.sendReportEmail.mockResolvedValue({
      ok: true,
      providerMessageId: "re_msg_123",
    });

    const response = await POST(new Request("http://localhost/api/report/send/report-token-1"), {
      params: Promise.resolve({ token: "report-token-1" }),
    });
    const body = (await response.json()) as {
      message?: string;
      providerMessageId?: string;
      reportUrl?: string;
      downloadReportUrl?: string;
    };

    expect(response.status).toBe(200);
    expect(body.message).toBe("Report email sent successfully.");
    expect(body.providerMessageId).toBe("re_msg_123");
    expect(body.reportUrl).toBe("http://localhost:3000/report/report-token-1");
    expect(body.downloadReportUrl).toBe("http://localhost:3000/api/report/pdf/report-token-1");
    expect(prismaMocks.reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "report_1" },
        data: expect.objectContaining({
          emailStatus: ReportEmailStatus.SENT,
          emailProviderMessageId: "re_msg_123",
          emailError: null,
          resendCount: undefined,
        }),
      }),
    );
  });

  it("marks report as FAILED when provider returns failure", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue({
      id: "report_2",
      reportToken: "report-token-2",
      reportUrlPath: "/report/report-token-2",
      emailStatus: ReportEmailStatus.PENDING,
      submission: {
        parentEmail: "parent@example.com",
        parentName: "Parent Two",
        childName: "Child Two",
      },
    });
    emailMocks.sendReportEmail.mockResolvedValue({
      ok: false,
      error: "Provider failed",
    });

    const response = await POST(new Request("http://localhost/api/report/send/report-token-2"), {
      params: Promise.resolve({ token: "report-token-2" }),
    });
    const body = (await response.json()) as { message?: string };

    expect(response.status).toBe(502);
    expect(body.message).toBe("Provider failed");
    expect(prismaMocks.reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "report_2" },
        data: {
          emailStatus: ReportEmailStatus.FAILED,
          emailError: "Provider failed",
          resendCount: undefined,
        },
      }),
    );
  });

  it("marks report as FAILED when helper throws an unexpected error", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue({
      id: "report_3",
      reportToken: "report-token-3",
      reportUrlPath: "/report/report-token-3",
      emailStatus: ReportEmailStatus.PENDING,
      submission: {
        parentEmail: "parent@example.com",
        parentName: "Parent Three",
        childName: "Child Three",
      },
    });
    emailMocks.sendReportEmail.mockRejectedValue(new Error("Missing API key"));

    const response = await POST(new Request("http://localhost/api/report/send/report-token-3"), {
      params: Promise.resolve({ token: "report-token-3" }),
    });
    const body = (await response.json()) as { message?: string };

    expect(response.status).toBe(500);
    expect(body.message).toBe("Missing API key");
    expect(prismaMocks.reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "report_3" },
        data: {
          emailStatus: ReportEmailStatus.FAILED,
          emailError: "Missing API key",
          resendCount: undefined,
        },
      }),
    );
  });

  it("blocks duplicate send when report is already SENT and no forceResend is provided", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue({
      id: "report_4",
      reportToken: "report-token-4",
      reportUrlPath: "/report/report-token-4",
      emailStatus: ReportEmailStatus.SENT,
      submission: {
        parentEmail: "parent@example.com",
        parentName: "Parent Four",
        childName: "Child Four",
      },
    });

    const response = await POST(new Request("http://localhost/api/report/send/report-token-4"), {
      params: Promise.resolve({ token: "report-token-4" }),
    });
    const body = (await response.json()) as { message?: string };

    expect(response.status).toBe(409);
    expect(body.message).toContain("already sent");
    expect(emailMocks.sendReportEmail).not.toHaveBeenCalled();
    expect(prismaMocks.reportUpdate).not.toHaveBeenCalled();
  });

  it("allows force resend and increments resendCount when report is already SENT", async () => {
    prismaMocks.reportFindUnique.mockResolvedValue({
      id: "report_5",
      reportToken: "report-token-5",
      reportUrlPath: "/report/report-token-5",
      emailStatus: ReportEmailStatus.SENT,
      submission: {
        parentEmail: "parent@example.com",
        parentName: "Parent Five",
        childName: "Child Five",
      },
    });
    emailMocks.sendReportEmail.mockResolvedValue({
      ok: true,
      providerMessageId: "re_msg_456",
    });

    const response = await POST(
      new Request("http://localhost/api/report/send/report-token-5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceResend: true }),
      }),
      {
        params: Promise.resolve({ token: "report-token-5" }),
      },
    );

    expect(response.status).toBe(200);
    expect(prismaMocks.reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "report_5" },
        data: expect.objectContaining({
          emailStatus: ReportEmailStatus.SENT,
          resendCount: { increment: 1 },
        }),
      }),
    );
  });
});
