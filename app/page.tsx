import { ChildDetailsForm } from "../components/checkup/ChildDetailsForm";
import { resolveCheckupLink } from "../lib/links/resolve-link";

export default async function HomePage() {
  const link = await resolveCheckupLink();

  return (
    <main className="checkup-page-shell">
      <ChildDetailsForm
        source="d2c"
        allowedGrades={link.allowedGrades}
        logoUrl={link.logoUrl}
      />
    </main>
  );
}
