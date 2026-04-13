import { permanentRedirect } from "next/navigation";

interface SchoolCheckupPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function SchoolCheckupPage({ params }: SchoolCheckupPageProps) {
  const { slug } = await params;
  permanentRedirect(`/s/${encodeURIComponent(slug)}`);
}
