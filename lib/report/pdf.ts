import { access } from "node:fs/promises";
import { join } from "node:path";
import { readdirSync } from "node:fs";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { put } from "@vercel/blob";

interface GenerateReportPdfInput {
  reportUrl: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 25_000;
const PDF_WINDOW_WIDTH = 794;
const PDF_WINDOW_HEIGHT = 1600;
const CHROMIUM_PACKAGE_VERSION = "147.0.1";
const DEFAULT_CHROMIUM_PACK_URL = `https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_PACKAGE_VERSION}/chromium-v${CHROMIUM_PACKAGE_VERSION}-pack.tar`;
const LOCAL_CHROME_ARGS = [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  `--window-size=${PDF_WINDOW_WIDTH},${PDF_WINDOW_HEIGHT}`,
];
const DEFAULT_CHROME_PATHS = [
  process.env.REPORT_PDF_CHROME_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter((path): path is string => Boolean(path && path.trim()));

function normalizeDirectoryPath(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

async function findChromiumPackageBinCandidates(): Promise<string[]> {
  const candidates: string[] = [];
  const fromEnv = normalizeDirectoryPath(process.env.REPORT_PDF_CHROMIUM_DIR);
  if (fromEnv) {
    candidates.push(fromEnv);
  }

  const nodeModulesDir = join(process.cwd(), "node_modules");
  candidates.push(join(nodeModulesDir, "@sparticuz", "chromium", "bin"));

  try {
    const scopedDir = join(nodeModulesDir, "@sparticuz");
    const entries = readdirSync(scopedDir, {
      withFileTypes: true,
    });
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith("chromium-")) {
        continue;
      }

      candidates.push(join(scopedDir, entry.name, "bin"));
    }
  } catch {
    // Ignore directory read errors.
  }

  return [...new Set(candidates)];
}

async function findLocalChromeExecutable(): Promise<string | null> {
  for (const candidate of DEFAULT_CHROME_PATHS) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try next candidate.
    }
  }

  return null;
}

async function resolveChromiumPackUrl(): Promise<string | null> {
  const fromEnv = normalizeDirectoryPath(process.env.REPORT_PDF_CHROMIUM_PACK_URL);
  if (fromEnv) {
    return fromEnv;
  }

  return DEFAULT_CHROMIUM_PACK_URL;
}

async function resolveChromeExecutablePath(): Promise<string> {
  const localExecutablePath = await findLocalChromeExecutable();
  if (localExecutablePath) {
    return localExecutablePath;
  }

  const chromiumBinCandidates = await findChromiumPackageBinCandidates();
  for (const binPath of chromiumBinCandidates) {
    try {
      await access(binPath);
      const executableFromBin = await chromium.executablePath(binPath);
      if (executableFromBin && executableFromBin.trim() !== "") {
        return executableFromBin;
      }
    } catch {
      // Try next candidate.
    }
  }

  try {
    const bundledExecutablePath = await chromium.executablePath();
    if (bundledExecutablePath && bundledExecutablePath.trim() !== "") {
      return bundledExecutablePath;
    }
  } catch {
    // Fall through to remote pack fallback below.
  }

  const chromiumPackUrl = await resolveChromiumPackUrl();
  if (chromiumPackUrl) {
    try {
      const executableFromRemotePack =
        await chromium.executablePath(chromiumPackUrl);
      if (executableFromRemotePack && executableFromRemotePack.trim() !== "") {
        return executableFromRemotePack;
      }
    } catch {
      // Preserve final generic error below.
    }
  }

  throw new Error(
    "Chrome executable not found. Set REPORT_PDF_CHROME_PATH, REPORT_PDF_CHROMIUM_DIR, or REPORT_PDF_CHROMIUM_PACK_URL.",
  );
}

export async function generateReportPdf({
  reportUrl,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: GenerateReportPdfInput): Promise<Buffer> {
  if (!reportUrl || reportUrl.trim() === "") {
    throw new Error("Report URL is required for PDF generation.");
  }

  const chromePath = await resolveChromeExecutablePath();
  const localExecutablePath = await findLocalChromeExecutable();
  const launchArgs = localExecutablePath
    ? LOCAL_CHROME_ARGS
    : [...chromium.args, `--window-size=${PDF_WINDOW_WIDTH},${PDF_WINDOW_HEIGHT}`];

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    args: launchArgs,
    headless: true,
    defaultViewport: {
      width: PDF_WINDOW_WIDTH,
      height: PDF_WINDOW_HEIGHT,
    },
  });
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(timeoutMs);
    page.setDefaultTimeout(timeoutMs);

    await page.goto(reportUrl, {
      waitUntil: "networkidle0",
      timeout: timeoutMs,
    });
    await page.emulateMediaType("print");
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const contentHeightPx = await page.evaluate(() => {
      const reportFooter = document.querySelector(".ls-report-footer") as HTMLElement | null;
      if (reportFooter) {
        const footerRect = reportFooter.getBoundingClientRect();
        return Math.ceil(footerRect.bottom + window.scrollY + 24);
      }

      const body = document.body;
      const html = document.documentElement;
      return Math.ceil(
        Math.max(
          body.scrollHeight,
          body.offsetHeight,
          body.clientHeight,
          html.scrollHeight,
          html.offsetHeight,
          html.clientHeight,
        ),
      );
    });
    const singlePageHeightPx = Math.min(
      Math.max(contentHeightPx + 24, 1200),
      19_000,
    );

    const pdfBytes = await page.pdf({
      printBackground: true,
      preferCSSPageSize: false,
      width: "210mm",
      height: `${singlePageHeightPx}px`,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}

interface StoreReportPdfInBlobInput {
  reportToken: string;
  pdfBytes: Buffer;
}

export async function storeReportPdfInBlob({
  reportToken,
  pdfBytes,
}: StoreReportPdfInBlobInput): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new Error("Missing required environment variable: BLOB_READ_WRITE_TOKEN");
  }

  if (!reportToken || reportToken.trim() === "") {
    throw new Error("Report token is required for PDF upload.");
  }

  const pathname = `reports/${reportToken}.pdf`;
  const blob = await put(pathname, pdfBytes, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/pdf",
    token,
  });

  return blob.url;
}
