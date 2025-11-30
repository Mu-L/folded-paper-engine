// src/website/docs/godotApiDocs.ts
import fs from "node:fs/promises";
import path from "node:path";
// import whatever XML + BBCode tooling you already use:
import { XMLParser } from "fast-xml-parser";
// import { bbcodeToHtml } from "./bbcode"; // ← your existing helper, for example

export type GodotApiPage = {
  slug: string;
  title: string;
  bodyHtml: string;
  headHtml: string; // usually empty, but available if you need per-page <head> bits
  summary: string;  // short text for index/search
};

const XML_DIR = path.resolve("dist/docs/ref-xml");
const API_CLASS_PREFIX = "class_"; // adjust to match your current file names (from gen-addon-docs.ts)

function classSlugFromFile(fileName: string): string {
  // e.g. "class_FoldedPaperEngine.xml" → "FoldedPaperEngine"
  return fileName
    .replace(/^class_/, "")
    .replace(/\.xml$/i, "");
}

// TODO: splice in your real “XML → HTML” logic from gen-addon-docs.ts here
function renderClassHtml(xml: any): { title: string; bodyHtml: string; summary: string } {
  const title = xml.class?.name ?? "Unknown";

  // This is placeholder structure – use your real one
  const brief = xml.class?.brief_description ?? "";
  const description = xml.class?.description ?? "";
  const methods: any[] = xml.class?.methods ?? [];
  const signals: any[] = xml.class?.signals ?? [];
  const properties: any[] = xml.class?.members ?? [];

  const parts: string[] = [];

  parts.push(`<h1>${title}</h1>`);

  if (brief) {
    parts.push(`<p class="api-brief">${brief}</p>`);
  }

  if (description) {
    parts.push(`<div class="api-description">${description}</div>`);
  }

  if (properties.length > 0) {
    parts.push("<h2>Properties</h2><dl class=\"api-properties\">");
    for (const p of properties) {
      parts.push(
        `<dt><code>${p.type} ${p.name}</code></dt><dd>${p.description ?? ""}</dd>`,
      );
    }
    parts.push("</dl>");
  }

  if (methods.length > 0) {
    parts.push("<h2>Methods</h2><dl class=\"api-methods\">");
    for (const m of methods) {
      const args = (m.arguments ?? [])
        .map((a: any) => `${a.type} ${a.name}`)
        .join(", ");
      parts.push(
        `<dt><code>${m.return_type} ${m.name}(${args})</code></dt><dd>${m.description ?? ""}</dd>`,
      );
    }
    parts.push("</dl>");
  }

  if (signals.length > 0) {
    parts.push("<h2>Signals</h2><dl class=\"api-signals\">");
    for (const s of signals) {
      parts.push(
        `<dt><code>${s.name}</code></dt><dd>${s.description ?? ""}</dd>`,
      );
    }
    parts.push("</dl>");
  }

  // summary: first non-empty text chunk
  const summary =
    brief ||
    description?.split(".")[0] ||
    `${title} API documentation`.trim();

  return {
    title,
    bodyHtml: parts.join("\n"),
    summary,
  };
}

/**
 * Load and transform ALL Godot XML docs into per-class pages.
 * Called from Astro at build time.
 */
export async function loadGodotApiPages(): Promise<GodotApiPage[]> {
  const parser = new XMLParser({ ignoreAttributes: false });

  const files = await fs.readdir(XML_DIR);
  const xmlFiles = files.filter((f) => f.startsWith(API_CLASS_PREFIX) && f.endsWith(".xml"));

  const pages: GodotApiPage[] = [];

  for (const file of xmlFiles) {
    const xmlPath = path.join(XML_DIR, file);
    const xmlText = await fs.readFile(xmlPath, "utf8");
    const xmlObj = parser.parse(xmlText);

    const slug = classSlugFromFile(file);
    const { title, bodyHtml, summary } = renderClassHtml(xmlObj);

    pages.push({
      slug,
      title,
      bodyHtml,
      headHtml: "", // hook for per-page <head> if you need it later
      summary,
    });
  }

  // Sort alphabetically for stable builds / index
  pages.sort((a, b) => a.slug.localeCompare(b.slug));

  return pages;
}
