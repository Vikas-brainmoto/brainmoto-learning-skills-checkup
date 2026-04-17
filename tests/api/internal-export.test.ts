import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => {
  return {
    submissionFindMany: vi.fn(),
  };
});

vi.mock("../../lib/db/prisma", () => ({
  prisma: {
    submission: {
      findMany: prismaMocks.submissionFindMany,
    },
  },
}));

import { GET } from "../../app/api/internal/submissions/export/route";

describe("GET /api/internal/submissions/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INTERNAL_ADMIN_KEY = "test-admin-key";
    process.env.NEXT_PUBLIC_APP_URL = "https://brainmoto.example";

    prismaMocks.submissionFindMany.mockResolvedValue([
      {
        id: "sub_1",
        createdAt: new Date("2026-04-16T10:00:00.000Z"),
        sourceType: "SCHOOL",
        checkupLink: { slug: "greenfield-primary-school" },
        school: { name: "Greenfield Primary School" },
        schoolNameAtSubmission: "Greenfield Primary School",
        divisionAtSubmission: "A",
        housingSocietyNameAtSubmission: null,
        childName: "Child One",
        parentName: "Parent One",
        parentEmail: "parent@example.com",
        parentWhatsapp: "+919999999999",
        grade: "Grade 2",
        gradeBand: "PRIMARY",
        finalScore: 71,
        finalLevel: "DOING_WELL",
        retakeNumber: 0,
        resultToken: "result_token_1",
        report: {
          reportToken: "report_token_1",
          reportUrlPath: "/report/report_token_1",
          emailStatus: "SENT",
          emailSentAt: new Date("2026-04-16T10:05:00.000Z"),
          pdfStatus: "GENERATED",
          pdfBlobUrl: "https://blob.vercel-storage.com/reports/report_token_1.pdf",
        },
      },
    ]);
  });

  it("returns 401 when admin key is missing or invalid", async () => {
    const response = await GET(
      new Request("http://localhost/api/internal/submissions/export?format=json"),
    );
    const body = (await response.json()) as { message?: string };

    expect(response.status).toBe(401);
    expect(body.message).toBe("Unauthorized.");
    expect(prismaMocks.submissionFindMany).not.toHaveBeenCalled();
  });

  it("returns JSON export with report links", async () => {
    const response = await GET(
      new Request("http://localhost/api/internal/submissions/export?format=json&limit=100", {
        headers: {
          "x-admin-key": "test-admin-key",
        },
      }),
    );
    const body = (await response.json()) as {
      count: number;
      rows: Array<Record<string, unknown>>;
    };

    expect(response.status).toBe(200);
    expect(body.count).toBe(1);
    expect(body.rows[0]?.resultUrl).toBe("https://brainmoto.example/result/result_token_1");
    expect(body.rows[0]?.reportUrl).toBe("https://brainmoto.example/report/report_token_1");
    expect(body.rows[0]?.downloadReportUrl).toBe(
      "https://brainmoto.example/api/report/pdf/report_token_1",
    );
    expect(body.rows[0]?.finalLevel).toBe("Doing Well");
  });

  it("returns CSV export when format=csv", async () => {
    const response = await GET(
      new Request("http://localhost/api/internal/submissions/export?format=csv", {
        headers: {
          "x-admin-key": "test-admin-key",
        },
      }),
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(body).toContain("submissionId,createdAtUtc,createdAtIst");
    expect(body).toContain("sub_1");
    expect(body).toContain("https://brainmoto.example/report/report_token_1");
  });
});
