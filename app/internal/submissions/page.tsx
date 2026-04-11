import Link from "next/link";
import { redirect } from "next/navigation";

import { POST as sendReportEmailRoute } from "../../api/report/send/[token]/route";
import { prisma } from "../../../lib/db/prisma";

interface InternalSubmissionsPageProps {
  searchParams: Promise<{
    key?: string;
    message?: string;
    error?: string;
  }>;
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getConfiguredAdminKey(): string | null {
  const value = process.env.INTERNAL_ADMIN_KEY?.trim();
  return value && value.length > 0 ? value : null;
}

function prettifySubmissionLevel(level: string): string {
  switch (level) {
    case "DOING_WELL":
      return "Doing Well";
    case "STILL_DEVELOPING":
      return "Still Developing";
    case "REQUIRES_SUPPORT":
      return "Requires Support";
    default:
      return level;
  }
}

function emailStatusChipClass(status: string): string {
  switch (status) {
    case "SENT":
      return "internal-chip internal-chip-green";
    case "FAILED":
      return "internal-chip internal-chip-red";
    default:
      return "internal-chip internal-chip-amber";
  }
}

function pdfStatusChipClass(status: string): string {
  switch (status) {
    case "GENERATED":
      return "internal-chip internal-chip-green";
    case "FAILED":
      return "internal-chip internal-chip-red";
    default:
      return "internal-chip internal-chip-muted";
  }
}

async function resendReportAction(formData: FormData): Promise<void> {
  "use server";

  const reportToken = String(formData.get("reportToken") ?? "").trim();
  const adminKey = String(formData.get("adminKey") ?? "").trim();
  const configuredAdminKey = getConfiguredAdminKey();

  if (!configuredAdminKey || adminKey !== configuredAdminKey) {
    redirect("/internal/submissions?error=Unauthorized");
  }

  if (!reportToken) {
    redirect(
      `/internal/submissions?key=${encodeURIComponent(adminKey)}&error=${encodeURIComponent("Missing report token.")}`,
    );
  }

  const response = await sendReportEmailRoute(
    new Request("http://localhost/internal/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ forceResend: true }),
    }),
    {
      params: Promise.resolve({ token: reportToken }),
    },
  );

  const payload = (await response.json()) as { message?: string };
  const encodedKey = encodeURIComponent(adminKey);
  const encodedMessage = encodeURIComponent(
    payload.message ?? "Resend request processed.",
  );

  if (response.status === 200) {
    redirect(`/internal/submissions?key=${encodedKey}&message=${encodedMessage}`);
  }

  redirect(`/internal/submissions?key=${encodedKey}&error=${encodedMessage}`);
}

export default async function InternalSubmissionsPage({
  searchParams,
}: InternalSubmissionsPageProps) {
  const params = await searchParams;
  const providedKey = params.key?.trim() ?? "";
  const configuredAdminKey = getConfiguredAdminKey();

  if (!configuredAdminKey) {
    return (
      <main className="internal-shell">
        <section className="internal-panel">
          <h1 className="internal-title">Internal Submissions</h1>
          <p className="internal-subtitle">
            <code>INTERNAL_ADMIN_KEY</code> is not configured. Add it to{" "}
            <code>.env.local</code> to use this page.
          </p>
        </section>
      </main>
    );
  }

  if (providedKey !== configuredAdminKey) {
    return (
      <main className="internal-shell">
        <section className="internal-panel">
          <h1 className="internal-title">Internal Submissions</h1>
          <p className="internal-subtitle">
            Unauthorized. Open this page with a valid <code>?key=...</code> query value.
          </p>
        </section>
      </main>
    );
  }

  const submissions = await prisma.submission.findMany({
    take: 100,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      checkupLink: {
        select: {
          slug: true,
        },
      },
      school: {
        select: {
          name: true,
        },
      },
      report: {
        select: {
          reportToken: true,
          emailStatus: true,
          emailSentAt: true,
          emailError: true,
          resendCount: true,
          pdfStatus: true,
          pdfBlobUrl: true,
          pdfGeneratedAt: true,
        },
      },
    },
  });

  return (
    <main className="internal-shell">
      <section className="internal-panel">
        <h1 className="internal-title">Internal Submissions</h1>
        <p className="internal-subtitle">
          Latest 100 submissions with email/PDF delivery status and resend action.
        </p>

        {params.message ? (
          <p className="internal-alert internal-alert-success">{params.message}</p>
        ) : null}
        {params.error ? (
          <p className="internal-alert internal-alert-error">{params.error}</p>
        ) : null}

        <div className="internal-table-wrap">
          <table className="internal-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Child</th>
                <th>Parent Email</th>
                <th>Grade</th>
                <th>Source</th>
                <th>Context</th>
                <th>Final</th>
                <th>Retake #</th>
                <th>Email</th>
                <th>PDF</th>
                <th>Links</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => {
                const contextText =
                  submission.sourceType === "SCHOOL"
                    ? submission.school?.name ??
                      submission.schoolNameAtSubmission ??
                      submission.checkupLink.slug
                    : submission.housingSocietyNameAtSubmission ?? "-";

                return (
                  <tr key={submission.id}>
                    <td>{formatDateTime(submission.createdAt)}</td>
                    <td>{submission.childName}</td>
                    <td>{submission.parentEmail}</td>
                    <td>{submission.grade}</td>
                    <td>
                      <span className="internal-chip internal-chip-muted">
                        {submission.sourceType}
                      </span>
                    </td>
                    <td>{contextText}</td>
                    <td>
                      <strong>{submission.finalScore}/100</strong>
                      <div className="internal-muted">
                        {prettifySubmissionLevel(submission.finalLevel)}
                      </div>
                    </td>
                    <td>{submission.retakeNumber}</td>
                    <td>
                      {submission.report ? (
                        <>
                          <span className={emailStatusChipClass(submission.report.emailStatus)}>
                            {submission.report.emailStatus}
                          </span>
                          {submission.report.emailSentAt ? (
                            <div className="internal-muted">
                              {formatDateTime(submission.report.emailSentAt)}
                            </div>
                          ) : null}
                          {submission.report.emailError ? (
                            <div className="internal-error-copy">
                              {submission.report.emailError}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <span className="internal-chip internal-chip-muted">NO_REPORT</span>
                      )}
                    </td>
                    <td>
                      {submission.report ? (
                        <>
                          <span className={pdfStatusChipClass(submission.report.pdfStatus)}>
                            {submission.report.pdfStatus}
                          </span>
                          {submission.report.pdfGeneratedAt ? (
                            <div className="internal-muted">
                              {formatDateTime(submission.report.pdfGeneratedAt)}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <span className="internal-chip internal-chip-muted">NO_REPORT</span>
                      )}
                    </td>
                    <td>
                      <div className="internal-links">
                        <Link href={`/result/${submission.resultToken}`}>Result</Link>
                        {submission.report ? (
                          <Link href={`/report/${submission.report.reportToken}`}>Report</Link>
                        ) : null}
                        {submission.report?.pdfBlobUrl ? (
                          <a
                            href={submission.report.pdfBlobUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            PDF Blob
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      {submission.report ? (
                        <form action={resendReportAction}>
                          <input
                            type="hidden"
                            name="reportToken"
                            value={submission.report.reportToken}
                          />
                          <input
                            type="hidden"
                            name="adminKey"
                            value={configuredAdminKey}
                          />
                          <button type="submit" className="internal-resend-btn">
                            Force Resend
                          </button>
                        </form>
                      ) : (
                        <span className="internal-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
