import { randomUUID } from "node:crypto";
import { access, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { put } from "@vercel/blob";

interface GenerateReportPdfInput {
  reportUrl: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 25_000;
const DEFAULT_CHROME_PATHS = [
  process.env.REPORT_PDF_CHROME_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter((path): path is string => Boolean(path && path.trim()));

async function findChromeExecutable(): Promise<string> {
  for (const candidate of DEFAULT_CHROME_PATHS) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try next candidate.
    }
  }

  throw new Error(
    "Chrome executable not found. Set REPORT_PDF_CHROME_PATH or install Google Chrome/Chromium.",
  );
}

function runCommand(
  command: string,
  args: string[],
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`PDF generation timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Chrome PDF command failed with exit code ${code}. ${stderr.trim()}`.trim(),
        ),
      );
    });
  });
}

export async function generateReportPdf({
  reportUrl,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: GenerateReportPdfInput): Promise<Buffer> {
  if (!reportUrl || reportUrl.trim() === "") {
    throw new Error("Report URL is required for PDF generation.");
  }

  const chromePath = await findChromeExecutable();
  const outputPath = join(tmpdir(), `brainmoto-report-${randomUUID()}.pdf`);

  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--print-to-pdf-no-header",
    `--print-to-pdf=${outputPath}`,
    reportUrl,
  ];

  try {
    await runCommand(chromePath, args, timeoutMs);
    return await readFile(outputPath);
  } finally {
    await rm(outputPath, { force: true });
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
