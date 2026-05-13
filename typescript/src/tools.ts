/** Custom tools registered alongside MCP-discovered ones. */
import * as fs from "node:fs";
import * as path from "node:path";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const IMAGES_DIR = path.resolve(import.meta.dirname, "..", "images");

const EXT_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

function detectMime(buf: Buffer, ext: string): string {
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") {
    return "image/png";
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  const header6 = buf.toString("ascii", 0, 6);
  if (header6 === "GIF87a" || header6 === "GIF89a") return "image/gif";
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return EXT_TO_MIME[ext.toLowerCase()] ?? "image/png";
}

function dataUri(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath);
  const mime = detectMime(buf, ext);
  const b64 = buf.toString("base64");
  return `data:${mime};base64,${b64}`;
}

export const sampleImage = tool(
  async () => {
    if (!fs.existsSync(IMAGES_DIR)) {
      return "No images found in the images/ directory.";
    }
    const files = fs
      .readdirSync(IMAGES_DIR)
      .filter((f) => Object.keys(EXT_TO_MIME).includes(path.extname(f).toLowerCase()))
      .sort();
    if (files.length === 0) {
      return "No images found in the images/ directory.";
    }

    const content: Record<string, unknown>[] = [
      { type: "text", text: "Sample image captured." },
    ];
    for (let i = 0; i < files.length; i++) {
      const uri = dataUri(path.join(IMAGES_DIR, files[i]));
      if (i % 2 === 0) {
        content.push({ type: "image_url", image_url: { url: uri } });
      } else {
        content.push({ type: "input_image", image_url: uri });
      }
      content.push({ type: "text", text: `Image ${i + 1} attached.` });
    }
    return JSON.stringify(content);
  },
  {
    name: "sample_image",
    description:
      "Return a sample image for multimodal testing. Call this tool whenever " +
      "the user asks to see a sample image or wants to test image handling.",
    schema: z.object({}),
  },
);

export function getCustomTools() {
  return [sampleImage];
}
