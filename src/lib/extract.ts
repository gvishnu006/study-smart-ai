import path from "path";

export interface ExtractInput {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  /** Optional text already extracted on the client (e.g. browser OCR). */
  clientText?: string;
}

export interface ExtractResult {
  text: string;
  pages?: number;
  method: "pdf" | "docx" | "txt" | "ocr" | "client";
}

function extOf(name: string) {
  return path.extname(name).toLowerCase();
}

export const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".doc",
  ".txt",
  ".md",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
];

export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_TEXT_CHARS = 500_000;

export function isImage(fileName: string, mimeType: string) {
  const ext = extOf(fileName);
  return (
    mimeType.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp"].includes(ext)
  );
}

export function normalizeText(input: string) {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function extractPdf(buffer: Buffer): Promise<ExtractResult> {
  const mod = await import("pdf-parse");
  const PDFParse = (mod as unknown as { PDFParse: new (o: { data: Buffer }) => {
    getText: () => Promise<{ text: string; total?: number; pages?: unknown[] }>;
    destroy: () => Promise<void>;
  } }).PDFParse;

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const pages = Array.isArray(result.pages)
      ? result.pages.length
      : result.total ?? undefined;
    return { text: normalizeText(result.text || ""), pages, method: "pdf" };
  } finally {
    try {
      await parser.destroy();
    } catch {
      /* ignore */
    }
  }
}

async function extractDocx(buffer: Buffer): Promise<ExtractResult> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return { text: normalizeText(result.value || ""), method: "docx" };
}

async function extractTxt(buffer: Buffer): Promise<ExtractResult> {
  return { text: normalizeText(buffer.toString("utf-8")), method: "txt" };
}

async function extractImage(buffer: Buffer): Promise<ExtractResult> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);
    return { text: normalizeText(text || ""), method: "ocr" };
  } finally {
    await worker.terminate();
  }
}

export async function extractText(input: ExtractInput): Promise<ExtractResult> {
  const { buffer, fileName, mimeType, clientText } = input;
  const ext = extOf(fileName);

  // Images: prefer text already extracted in the browser (fast, no server load).
  if (isImage(fileName, mimeType)) {
    if (clientText && clientText.trim().length > 10) {
      return { text: normalizeText(clientText), method: "client" };
    }
    return extractImage(buffer);
  }

  if (ext === ".pdf" || mimeType === "application/pdf") {
    return extractPdf(buffer);
  }
  if (ext === ".docx" || ext === ".doc" || mimeType.includes("word")) {
    return extractDocx(buffer);
  }
  if (ext === ".txt" || ext === ".md" || mimeType.startsWith("text/")) {
    return extractTxt(buffer);
  }

  throw new Error(
    "Unsupported file type. Upload a PDF, DOCX, TXT, or image file."
  );
}
