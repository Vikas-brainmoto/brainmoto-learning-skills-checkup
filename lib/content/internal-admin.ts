import { NextResponse } from "next/server";

export function getConfiguredAdminKey(): string | null {
  const value = process.env.INTERNAL_ADMIN_KEY?.trim();
  return value && value.length > 0 ? value : null;
}

export function resolveProvidedAdminKey(request: Request): string {
  const url = new URL(request.url);
  return (
    request.headers.get("x-admin-key")?.trim() ??
    url.searchParams.get("key")?.trim() ??
    ""
  );
}

export function ensureInternalAdminAuthorized(request: Request): NextResponse | null {
  const configured = getConfiguredAdminKey();
  if (!configured) {
    return NextResponse.json(
      { message: "INTERNAL_ADMIN_KEY is not configured." },
      { status: 500 },
    );
  }

  const provided = resolveProvidedAdminKey(request);
  if (provided !== configured) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  return null;
}
