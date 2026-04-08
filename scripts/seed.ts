import { LinkSourceType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALL_GRADES = [
  "Nursery",
  "Jr KG",
  "Sr KG",
  "UKG",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
];

const PREPRIMARY_GRADES = ["Nursery", "Jr KG", "Sr KG", "UKG"];
const PRIMARY_GRADES = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];

async function main() {
  const sunriseSchool = await prisma.school.upsert({
    where: { slug: "sunrise-kids-academy" },
    update: {
      name: "Sunrise Kids Academy",
      logoUrl: "/logo.webp",
      primaryColorHex: "#0F766E",
      isActive: true,
    },
    create: {
      name: "Sunrise Kids Academy",
      slug: "sunrise-kids-academy",
      logoUrl: "/logo.webp",
      primaryColorHex: "#0F766E",
      isActive: true,
    },
  });

  const greenfieldSchool = await prisma.school.upsert({
    where: { slug: "greenfield-primary-school" },
    update: {
      name: "Greenfield Primary School",
      logoUrl: "/logo.webp",
      primaryColorHex: "#1D4ED8",
      isActive: true,
    },
    create: {
      name: "Greenfield Primary School",
      slug: "greenfield-primary-school",
      logoUrl: "/logo.webp",
      primaryColorHex: "#1D4ED8",
      isActive: true,
    },
  });

  await prisma.checkupLink.upsert({
    where: { slug: "d2c-public" },
    update: {
      sourceType: LinkSourceType.D2C,
      schoolId: null,
      landingTitle: "Brainmoto Learning Skills Check-Up",
      landingDescription:
        "Parent-facing public link for Learning Skills Check-Up across Pre-primary and Primary grades.",
      allowedGrades: ALL_GRADES,
      isActive: true,
    },
    create: {
      slug: "d2c-public",
      sourceType: LinkSourceType.D2C,
      landingTitle: "Brainmoto Learning Skills Check-Up",
      landingDescription:
        "Parent-facing public link for Learning Skills Check-Up across Pre-primary and Primary grades.",
      allowedGrades: ALL_GRADES,
      isActive: true,
    },
  });

  await prisma.checkupLink.upsert({
    where: { slug: sunriseSchool.slug },
    update: {
      sourceType: LinkSourceType.SCHOOL,
      schoolId: sunriseSchool.id,
      landingTitle: "Sunrise Kids Academy x Brainmoto Check-Up",
      landingDescription:
        "School-branded check-up link for Sunrise parents (Pre-primary grades only).",
      allowedGrades: PREPRIMARY_GRADES,
      isActive: true,
    },
    create: {
      slug: sunriseSchool.slug,
      sourceType: LinkSourceType.SCHOOL,
      schoolId: sunriseSchool.id,
      landingTitle: "Sunrise Kids Academy x Brainmoto Check-Up",
      landingDescription:
        "School-branded check-up link for Sunrise parents (Pre-primary grades only).",
      allowedGrades: PREPRIMARY_GRADES,
      isActive: true,
    },
  });

  await prisma.checkupLink.upsert({
    where: { slug: greenfieldSchool.slug },
    update: {
      sourceType: LinkSourceType.SCHOOL,
      schoolId: greenfieldSchool.id,
      landingTitle: "Greenfield Primary School x Brainmoto Check-Up",
      landingDescription:
        "School-branded check-up link for Greenfield parents (Primary grades only).",
      allowedGrades: PRIMARY_GRADES,
      isActive: true,
    },
    create: {
      slug: greenfieldSchool.slug,
      sourceType: LinkSourceType.SCHOOL,
      schoolId: greenfieldSchool.id,
      landingTitle: "Greenfield Primary School x Brainmoto Check-Up",
      landingDescription:
        "School-branded check-up link for Greenfield parents (Primary grades only).",
      allowedGrades: PRIMARY_GRADES,
      isActive: true,
    },
  });

  console.log("Seed complete: 1 D2C link and 2 school links are ready.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
