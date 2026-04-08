import { LinkSourceType } from "@prisma/client";

import { prisma } from "../db/prisma";
import { ALL_GRADES } from "../scoring/flow";

const D2C_DEFAULT_SLUG = "d2c-public";

export interface ResolvedCheckupLink {
  source: "d2c" | "school";
  slug: string;
  schoolName: string;
  logoUrl: string;
  landingTitle: string;
  landingDescription: string;
  allowedGrades: string[];
}

function parseAllowedGrades(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [...ALL_GRADES];
  }

  const grades = value.filter((grade): grade is string => typeof grade === "string");
  return grades.length > 0 ? grades : [...ALL_GRADES];
}

function formatSchoolNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter((part) => part.trim() !== "")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildD2CFallback(): ResolvedCheckupLink {
  return {
    source: "d2c",
    slug: D2C_DEFAULT_SLUG,
    schoolName: "Brainmoto",
    logoUrl: "/logo.webp",
    landingTitle: "Brainmoto Learning Skills Check-Up",
    landingDescription:
      "Parent-facing public link for Learning Skills Check-Up across Pre-primary and Primary grades.",
    allowedGrades: [...ALL_GRADES],
  };
}

export async function resolveCheckupLink(
  slug?: string,
): Promise<ResolvedCheckupLink> {
  if (!slug) {
    let link = null;
    try {
      link = await prisma.checkupLink.findUnique({
        where: { slug: D2C_DEFAULT_SLUG },
      });
    } catch {
      return buildD2CFallback();
    }

    if (!link || !link.isActive || link.sourceType !== LinkSourceType.D2C) {
      return buildD2CFallback();
    }

    return {
      source: "d2c",
      slug: link.slug,
      schoolName: "Brainmoto",
      logoUrl: "/logo.webp",
      landingTitle: link.landingTitle ?? "Brainmoto Learning Skills Check-Up",
      landingDescription:
        link.landingDescription ??
        "Parent-facing public link for Learning Skills Check-Up across Pre-primary and Primary grades.",
      allowedGrades: parseAllowedGrades(link.allowedGrades),
    };
  }

  const link = await prisma.checkupLink.findUnique({
    where: { slug },
    include: { school: true },
  });

  if (!link || !link.isActive || link.sourceType !== LinkSourceType.SCHOOL) {
    throw new Error(`Active school link not found for slug "${slug}".`);
  }

  const schoolName = link.school?.name ?? formatSchoolNameFromSlug(link.slug);

  return {
    source: "school",
    slug: link.slug,
    schoolName,
    logoUrl: link.school?.logoUrl ?? "/logo.webp",
    landingTitle: link.landingTitle ?? `${schoolName} x Brainmoto Check-Up`,
    landingDescription:
      link.landingDescription ??
      "School-branded check-up link for parents.",
    allowedGrades: parseAllowedGrades(link.allowedGrades),
  };
}
