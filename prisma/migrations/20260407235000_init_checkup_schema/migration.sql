-- CreateEnum
CREATE TYPE "LinkSourceType" AS ENUM ('D2C', 'SCHOOL');

-- CreateEnum
CREATE TYPE "GradeBand" AS ENUM ('PREPRIMARY', 'PRIMARY');

-- CreateEnum
CREATE TYPE "SubmissionLevel" AS ENUM ('DOING_WELL', 'STILL_DEVELOPING', 'REQUIRES_SUPPORT');

-- CreateEnum
CREATE TYPE "ReportEmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "PdfStatus" AS ENUM ('NOT_REQUESTED', 'GENERATED', 'FAILED');

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColorHex" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkup_links" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sourceType" "LinkSourceType" NOT NULL,
    "schoolId" TEXT,
    "landingTitle" TEXT,
    "landingDescription" TEXT,
    "allowedGrades" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkup_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "resultToken" TEXT NOT NULL,
    "sourceType" "LinkSourceType" NOT NULL,
    "checkupLinkId" TEXT NOT NULL,
    "schoolId" TEXT,
    "parentName" TEXT NOT NULL,
    "parentEmail" TEXT NOT NULL,
    "parentWhatsapp" TEXT,
    "childName" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "gradeBand" "GradeBand" NOT NULL,
    "schoolNameAtSubmission" TEXT,
    "answers" JSONB NOT NULL,
    "skillScores" JSONB NOT NULL,
    "finalScore" INTEGER NOT NULL,
    "finalLevel" "SubmissionLevel" NOT NULL,
    "retakeNumber" INTEGER NOT NULL DEFAULT 0,
    "previousSubmissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reportToken" TEXT NOT NULL,
    "reportUrlPath" TEXT NOT NULL,
    "emailStatus" "ReportEmailStatus" NOT NULL DEFAULT 'PENDING',
    "emailProviderMessageId" TEXT,
    "emailError" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "pdfStatus" "PdfStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "pdfBlobUrl" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "schools"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "checkup_links_slug_key" ON "checkup_links"("slug");

-- CreateIndex
CREATE INDEX "checkup_links_sourceType_idx" ON "checkup_links"("sourceType");

-- CreateIndex
CREATE INDEX "checkup_links_schoolId_idx" ON "checkup_links"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_resultToken_key" ON "submissions"("resultToken");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_previousSubmissionId_key" ON "submissions"("previousSubmissionId");

-- CreateIndex
CREATE INDEX "submissions_parentEmail_childName_grade_idx" ON "submissions"("parentEmail", "childName", "grade");

-- CreateIndex
CREATE INDEX "submissions_checkupLinkId_createdAt_idx" ON "submissions"("checkupLinkId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "reports_submissionId_key" ON "reports"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "reports_reportToken_key" ON "reports"("reportToken");

-- CreateIndex
CREATE INDEX "reports_emailStatus_idx" ON "reports"("emailStatus");

-- CreateIndex
CREATE INDEX "reports_pdfStatus_idx" ON "reports"("pdfStatus");

-- AddForeignKey
ALTER TABLE "checkup_links" ADD CONSTRAINT "checkup_links_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_checkupLinkId_fkey" FOREIGN KEY ("checkupLinkId") REFERENCES "checkup_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_previousSubmissionId_fkey" FOREIGN KEY ("previousSubmissionId") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
