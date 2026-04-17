import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendReportEmail } from "../../lib/email/resend";

describe("sendReportEmail", () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFromEmail = process.env.RESEND_FROM_EMAIL;

  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM_EMAIL = "Brainmoto <reports@brainmoto.in>";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = originalApiKey;
    process.env.RESEND_FROM_EMAIL = originalFromEmail;
  });

  it("returns message id on successful resend API call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "re_msg_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await sendReportEmail({
      toEmail: "parent@example.com",
      parentName: "Parent One",
      childName: "Child One",
      reportUrl: "https://example.com/report/abc",
      downloadReportUrl: "https://example.com/api/report/pdf/abc",
    });

    expect(result).toEqual({
      ok: true,
      providerMessageId: "re_msg_123",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, requestInit] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const payload = JSON.parse(String(requestInit?.body)) as {
      html?: string;
      text?: string;
    };
    expect(payload.html).toContain("Download Full Report (PDF)");
    expect(payload.html).toContain("https://example.com/api/report/pdf/abc");
    expect(payload.text).toContain(
      "Download full report (PDF): https://example.com/api/report/pdf/abc",
    );
  });

  it("returns provider error message on failed resend API call", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { message: "Invalid API key" },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const result = await sendReportEmail({
      toEmail: "parent@example.com",
      parentName: "Parent One",
      childName: "Child One",
      reportUrl: "https://example.com/report/abc",
    });

    expect(result).toEqual({
      ok: false,
      error: "Invalid API key",
    });
  });

  it("throws when required resend env vars are missing", async () => {
    delete process.env.RESEND_API_KEY;

    await expect(
      sendReportEmail({
        toEmail: "parent@example.com",
        parentName: "Parent One",
        childName: "Child One",
        reportUrl: "https://example.com/report/abc",
      }),
    ).rejects.toThrow("Missing required environment variable: RESEND_API_KEY");
  });
});
