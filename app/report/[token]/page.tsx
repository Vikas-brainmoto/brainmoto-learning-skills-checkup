import { notFound } from "next/navigation";

import { ReportDocument } from "../../../components/report/ReportDocument";
import { buildReportData } from "../../../lib/report/build-report-data";

interface ReportPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { token } = await params;
  const report = await buildReportData(token);

  if (!report) {
    notFound();
  }

  return (
    <main className="report-page-shell">
      <ReportDocument report={report} />
    </main>
  );
}
