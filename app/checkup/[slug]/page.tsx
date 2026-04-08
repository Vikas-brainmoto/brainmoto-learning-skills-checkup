import { ChildDetailsForm } from "../../../components/checkup/ChildDetailsForm";
import { resolveCheckupLink } from "../../../lib/links/resolve-link";
import { notFound } from "next/navigation";

interface SchoolCheckupPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function SchoolCheckupPage({ params }: SchoolCheckupPageProps) {
  const { slug } = await params;

  let link;
  try {
    link = await resolveCheckupLink(slug);
  } catch {
    notFound();
  }

  return (
    <main>
      <ChildDetailsForm
        source="school"
        schoolSlug={link.slug}
        presetSchoolName={link.schoolName}
        allowedGrades={link.allowedGrades}
        landingTitle={link.landingTitle}
        landingDescription={link.landingDescription}
        logoUrl={link.logoUrl}
      />
    </main>
  );
}
