import { ChildDetailsForm } from "../../components/checkup/ChildDetailsForm";
import { resolveCheckupLink } from "../../lib/links/resolve-link";

export default async function CheckupPage() {
  const link = await resolveCheckupLink();

  return (
    <main>
      <ChildDetailsForm
        source="d2c"
        allowedGrades={link.allowedGrades}
        landingTitle={link.landingTitle}
        landingDescription={link.landingDescription}
        logoUrl={link.logoUrl}
      />
    </main>
  );
}
