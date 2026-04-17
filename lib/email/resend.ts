interface SendReportEmailInput {
  toEmail: string;
  parentName: string;
  childName: string;
  reportUrl: string;
  downloadReportUrl?: string;
}

export interface SendReportEmailResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildEmailBody(input: SendReportEmailInput): { subject: string; html: string; text: string } {
  const safeParentName = escapeHtml(input.parentName);
  const safeChildName = escapeHtml(input.childName);
  const safeReportUrl = escapeHtml(input.reportUrl);
  const safeDownloadReportUrl = input.downloadReportUrl
    ? escapeHtml(input.downloadReportUrl)
    : null;
  const downloadSectionHtml = safeDownloadReportUrl
    ? `
        <p>
          <a href="${safeDownloadReportUrl}" target="_blank" rel="noreferrer">Download Full Report (PDF)</a>
        </p>
        <p>If download does not start, copy and paste this URL into your browser:</p>
        <p>${safeDownloadReportUrl}</p>
      `
    : "";
  const downloadSectionText = input.downloadReportUrl
    ? [
        "",
        `Download full report (PDF): ${input.downloadReportUrl}`,
      ]
    : [];

  return {
    subject: `${input.childName} - Brainmoto Learning Skills Check-Up Report`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <p>Hi ${safeParentName},</p>
        <p>
          Your detailed <strong>Brainmoto Learning Skills Check-Up</strong> report for
          <strong>${safeChildName}</strong> is ready.
        </p>
        <p>
          <a href="${safeReportUrl}" target="_blank" rel="noreferrer">Open Report</a>
        </p>
        <p>If the button/link does not work, copy and paste this URL into your browser:</p>
        <p>${safeReportUrl}</p>
        ${downloadSectionHtml}
        <p>Regards,<br/>Brainmoto Team</p>
      </div>
    `,
    text: [
      `Hi ${input.parentName},`,
      "",
      `Your detailed Brainmoto Learning Skills Check-Up report for ${input.childName} is ready.`,
      "",
      `Open report: ${input.reportUrl}`,
      ...downloadSectionText,
      "",
      "Regards,",
      "Brainmoto Team",
    ].join("\n"),
  };
}

export async function sendReportEmail(
  input: SendReportEmailInput,
): Promise<SendReportEmailResult> {
  const apiKey = getRequiredEnv("RESEND_API_KEY");
  const from = getRequiredEnv("RESEND_FROM_EMAIL");
  const { subject, html, text } = buildEmailBody(input);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.toEmail],
      subject,
      html,
      text,
    }),
  });

  const responseBody = (await response.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
    message?: string;
  };

  if (!response.ok) {
    return {
      ok: false,
      error:
        responseBody.error?.message ??
        responseBody.message ??
        `Resend request failed with status ${response.status}`,
    };
  }

  return {
    ok: true,
    providerMessageId: responseBody.id,
  };
}
