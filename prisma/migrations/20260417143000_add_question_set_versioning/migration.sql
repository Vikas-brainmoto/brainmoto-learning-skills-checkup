-- CreateEnum
CREATE TYPE "QuestionSetFlow" AS ENUM ('PREPRIMARY', 'PRIMARY');

-- CreateEnum
CREATE TYPE "QuestionSetVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "question_sets" (
    "id" TEXT NOT NULL,
    "flow" "QuestionSetFlow" NOT NULL,
    "title" TEXT NOT NULL,
    "published_version_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_set_versions" (
    "id" TEXT NOT NULL,
    "question_set_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "QuestionSetVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "question_config" JSONB NOT NULL,
    "report_content" JSONB NOT NULL,
    "notes" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_set_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_sets_flow_key" ON "question_sets"("flow");

-- CreateIndex
CREATE UNIQUE INDEX "question_set_versions_question_set_id_version_number_key" ON "question_set_versions"("question_set_id", "version_number");

-- CreateIndex
CREATE INDEX "question_set_versions_question_set_id_status_idx" ON "question_set_versions"("question_set_id", "status");

-- AddForeignKey
ALTER TABLE "question_set_versions" ADD CONSTRAINT "question_set_versions_question_set_id_fkey" FOREIGN KEY ("question_set_id") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
