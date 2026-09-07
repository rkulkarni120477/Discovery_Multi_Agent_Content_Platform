import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export async function extractText(filename: string, buffer: Buffer): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (ext === "pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown PDF parsing error";
      throw new Error(`Failed to parse PDF "${filename}": ${message}`);
    } finally {
      await parser.destroy();
    }
  }
  if (ext === "txt" || ext === "md") {
    return buffer.toString("utf-8");
  }
  throw new Error(`Unsupported file type: .${ext}. Supported: .docx, .pdf, .txt, .md`);
}
