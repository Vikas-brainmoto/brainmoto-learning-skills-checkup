import { access } from "node:fs/promises";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { put } from "@vercel/blob";

interface GenerateReportPdfInput {
  reportUrl: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 25_000;
const PDF_WINDOW_WIDTH = 1440;
const PDF_WINDOW_HEIGHT = 2200;
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

async function resolveChromeExecutablePath(): Promise<string> {
  const localExecutablePath = await findLocalChromeExecutable();
  if (localExecutablePath) {
    return localExecutablePath;
  }

  const bundledExecutablePath = await chromium.executablePath();
  if (bundledExecutablePath && bundledExecutablePath.trim() !== "") {
    return bundledExecutablePath;
  }

  throw new Error(
    "Chrome executable not found. Set REPORT_PDF_CHROME_PATH or install Google Chrome/Chromium. On Vercel, ensure @sparticuz/chromium is bundled.",
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
    await page.emulateMediaType("screen");
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const pdfBytes = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
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
