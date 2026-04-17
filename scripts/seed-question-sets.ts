import { prisma } from "../lib/db/prisma";
import { getDefaultQuestionSetContentForFlow } from "../lib/content/question-set-store";

async function ensurePublishedVersion(flow: "preprimary" | "primary"): Promise<void> {
  const flowEnum = flow === "preprimary" ? "PREPRIMARY" : "PRIMARY";
  const title = flow === "preprimary" ? "Pre-primary Question Set" : "Primary Question Set";
  const defaults = getDefaultQuestionSetContentForFlow(flow);

  const set = await prisma.questionSet.upsert({
    where: {
      flow: flowEnum,
    },
    update: {
      title,
    },
    create: {
      flow: flowEnum,
      title,
    },
    select: {
      id: true,
      publishedVersionNumber: true,
    },
  });

  const versions = await prisma.questionSetVersion.findMany({
    where: {
      questionSetId: set.id,
    },
    orderBy: {
      versionNumber: "asc",
    },
    select: {
      versionNumber: true,
      status: true,
    },
  });

  if (versions.length === 0) {
    await prisma.questionSetVersion.create({
      data: {
        questionSetId: set.id,
        versionNumber: 1,
        status: "PUBLISHED",
        questionConfig: defaults.questionConfig as unknown as object,
        reportContent: defaults.reportContent as unknown as object,
        notes: "Initial seeded version from code defaults.",
        publishedAt: new Date(),
      },
    });

    await prisma.questionSet.update({
      where: { id: set.id },
      data: {
        publishedVersionNumber: 1,
      },
    });

    console.log(`[${flow}] created initial published version 1.`);
    return;
  }

  if (set.publishedVersionNumber) {
    console.log(`[${flow}] published version already set to ${set.publishedVersionNumber}.`);
    return;
  }

  const publishedVersion = versions.find((version) => version.status === "PUBLISHED");
  if (publishedVersion) {
    await prisma.questionSet.update({
      where: { id: set.id },
      data: {
        publishedVersionNumber: publishedVersion.versionNumber,
      },
    });
    console.log(
      `[${flow}] attached existing published version ${publishedVersion.versionNumber} to question_set.`,
    );
    return;
  }

  const nextVersionNumber = versions[versions.length - 1].versionNumber + 1;
  await prisma.questionSetVersion.create({
    data: {
      questionSetId: set.id,
      versionNumber: nextVersionNumber,
      status: "PUBLISHED",
      questionConfig: defaults.questionConfig as unknown as object,
      reportContent: defaults.reportContent as unknown as object,
      notes: "Autocreated published baseline because no published version existed.",
      publishedAt: new Date(),
    },
  });

  await prisma.questionSet.update({
    where: { id: set.id },
    data: {
      publishedVersionNumber: nextVersionNumber,
    },
  });
  console.log(`[${flow}] created and published version ${nextVersionNumber}.`);
}

async function main() {
  await ensurePublishedVersion("preprimary");
  await ensurePublishedVersion("primary");
  console.log("Question-set seed complete.");
}

main()
  .catch((error) => {
    console.error(
      "Question-set seed failed:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
