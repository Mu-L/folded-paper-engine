#!/usr/bin/env ts-node

import {promises as fs} from "node:fs";
import path from "node:path";
import fse from "fs-extra";
import {XMLParser} from "fast-xml-parser";

// --- config ------------------------------------------------------------------

const XML_DIR = "dist/docs/ref-xml";
const OUTPUT_DIR = "dist/godot-api-docs";
const TEMPLATE_PATH = path.join(OUTPUT_DIR, "template.html");

// --- types -------------------------------------------------------------------

export type ClassDoc = {
  class: {
    "@_name": string;
    "@_inherits"?: string;
    brief_description?: string;
    description?: string;
    methods?: { method: any[] } | { method: any };
    members?: { member: any[] } | { member: any };
    signals?: { signal: any[] } | { signal: any };
    constants?: { constant: any[] } | { constant: any };
  };
};

// --- utils -------------------------------------------------------------------

async function listXml(dir: string): Promise<string[]> {
  const ents = await fs.readdir(dir, {withFileTypes: true});
  return ents.filter(e => e.isFile() && e.name.endsWith(".xml")).map(e => path.join(dir, e.name));
}

function esc(s = ""): string {
  return s.replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]!));
}

function escCode(s = ""): string {
  // escape only HTML meta chars; preserve \n so <pre> shows real lines
  return s.replace(/[&<>]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"}[c]!));
}

function decodeEntities(s = ""): string {
  // just the ones Godot uses in attributes
  return s
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

// --- pretty code -------------------------------------------------------------

function tryJsonPretty(s: string): string {
  let out = s;
  try {
    const parsed = JSON.parse(s);
    out = JSON.stringify(parsed, null, 2);
  } catch {
    out = s;
  }
  return out;
}

function prettyGodotContainer(s: string): string {
  const t = s.trim();

  let inner = "";
  let dictMatch = t.match(/^Dictionary\[[^\]]*\]\s*\(\s*(\{[\s\S]*\})\s*\)\s*$/);
  if (dictMatch) {
    inner = dictMatch[1];
  } else {
    let arrMatch = t.match(/^Array\[[^\]]*\]\s*\(\s*(\[[\s\S]*\])\s*\)\s*$/);
    if (arrMatch) {
      inner = arrMatch[1];
    }
  }

  let out = t;
  if (inner) {
    out = tryJsonPretty(inner);
  } else if (/^\s*[\[{][\s\S]*[\]}]\s*$/.test(t)) {
    out = tryJsonPretty(t);
  } else {
    out = t
      .replace(/([{\[])\s*/g, "$1\n")
      .replace(/\s*([}\]])/g, "\n$1")
      .replace(/,\s*/g, ",\n")
      .replace(/\n{2,}/g, "\n");
  }

  return out;
}

function formatSnippet(raw = ""): string {
  const t = raw.trim();
  let out = raw;
  if (t.length > 0) {
    out = prettyGodotContainer(t);
  }
  return out;
}

// --- bbcode -> html ----------------------------------------------------------

function bb(s = ""): string {
  return s
    .replace(/\[codeblock\]([\s\S]*?)\[\/codeblock\]/g, (_m, g) => `<pre class="code"><code>${escCode(formatSnippet(g))}</code></pre>`)
    .replace(/\[code\]([\s\S]*?)\[\/code\]/g, (_m, g) => `<code class="code">${escCode(formatSnippet(g))}</code>`)
    .replace(/\[b\]([\s\S]*?)\[\/b\]/g, "<strong>$1</strong>")
    .replace(/\[i\]([\s\S]*?)\[\/i\]/g, "<em>$1</em>")
    .replace(/\[br\]/g, "<br/>")
    .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/g, '<a href="$1">$2</a>');
}

function toFileName(raw: string): string {
  let n = raw.replace(/^"+|"+$/g, "");
  n = n.replace(/^res:\/\//, "");
  n = n.replace(/[\/\\]+/g, "__");
  n = n.replace(/[^A-Za-z0-9._-]/g, "_");
  return n || "unnamed";
}

function toDisplayName(raw: string): string {
  let n = raw.replace(/^"+|"+$/g, "");
  if (n.startsWith("res://")) n = path.basename(n);
  return n;
}

function arr<T>(x?: T | T[]): T[] {
  return x ? (Array.isArray(x) ? x : [x]) : [];
}

// --- templating --------------------------------------------------------------

let TEMPLATE_CACHE = "";

async function loadTemplate(): Promise<string> {
  if (TEMPLATE_CACHE.length === 0) {
    TEMPLATE_CACHE = await fs.readFile(TEMPLATE_PATH, "utf8");
  }
  return TEMPLATE_CACHE;
}

function renderTemplate(tpl: string, data: Record<string, string>): string {
  return tpl.replace(/{{\s*([A-Z_]+)\s*}}/g, (_m, k) => data[k] ?? "");
}

async function page(title: string, body: string, extraHead = ""): Promise<string> {
  const tpl = await loadTemplate();
  return renderTemplate(tpl, {TITLE: title, BODY: body, EXTRA_HEAD: extraHead});
}

// --- main --------------------------------------------------------------------

async function main() {
  await fse.ensureDir(OUTPUT_DIR);

  const files = await listXml(XML_DIR);
  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => ["member", "method", "signal", "param", "constant"].includes(name),
    trimValues: false,
  });

  const classes: { raw: string; display: string; inherits?: string }[] = [];

  for (const file of files) {
    const xml = await fs.readFile(file, "utf8");
    const doc = parser.parse(xml) as ClassDoc;
    const C = doc.class;

    const rawName = C["@_name"];
    const display = toDisplayName(rawName);
    const inherits = C["@_inherits"];
    classes.push({raw: rawName, display, inherits});

    const props = arr((C.members as any)?.member)
      .map((m: any) =>
        `<li>
          <div><code class="code">${esc(m["@_type"] ?? "var")} ${esc(m["@_name"])}${m["@_default"] ? ` = ${esc(m["@_default"])}` : ""}</code></div>
          <div class="small">${bb(m.description || "")}</div>
        </li>`
      )
      .join("");

    const methods = arr((C.methods as any)?.method)
      .map((m: any) => {
        const ret = m.return?.["@_type"] ?? "void";
        const ps = arr(m.param)
          .map((p: any) => `${esc(p["@_type"] || "var")} ${esc(p["@_name"])}${p["@_default"] ? ` = ${esc(p["@_default"])}` : ""}`)
          .join(", ");
        return `<li>
          <div><code class="code">${esc(ret)} ${esc(m["@_name"])}(${esc(ps)})</code></div>
          <div class="small">${bb(m.description || "")}</div>
        </li>`;
      })
      .join("");

    const signals = arr((C.signals as any)?.signal)
      .map((s: any) => {
        const ps = arr(s.param).map((p: any) => `${esc(p["@_type"] || "var")} ${esc(p["@_name"])}`).join(", ");
        return `<li>
          <div><code class="code">signal ${esc(s["@_name"])}(${esc(ps)})</code></div>
          <div class="small">${bb(s.description || "")}</div>
        </li>`;
      })
      .join("");

    const consts = arr((C.constants as any)?.constant)
      .map((x: any) => {
        const name = String(x["@_name"] ?? "");
        const raw = decodeEntities(String(x["@_value"] ?? ""));
        const pretty = formatSnippet(raw);
        const code = pretty.includes("\n")
          ? `<pre class="code"><code>${escCode(`${name} = ${pretty}`)}</code></pre>`
          : `<code class="code">${escCode(`${name} = ${pretty}`)}</code>`;
        return `<li>
      ${code}
      ${x.description ? `<div class="small">${bb(x.description)}</div>` : ""}
    </li>`;
      })
      .join("");

    const body = `
<div class="api-grid">
  <aside class="api-aside">
    <div class="api-card">
      <div><strong>Class:</strong> ${esc(display)}</div>
      ${inherits ? `<div class="small">Inherits: ${esc(inherits)}</div>` : ""}
      ${C.brief_description ? `<hr class="small"/><div>${bb(C.brief_description)}</div>` : ""}
    </div>
  </aside>
  <section class="api-main">
    ${C.description ? `<div class="api-card">${bb(C.description)}</div>` : ""}
    ${props ? `<div class="api-card"><h2>Properties</h2><ul class="api-list">${props}</ul></div>` : ""}
    ${methods ? `<div class="api-card"><h2>Methods</h2><ul class="api-list">${methods}</ul></div>` : ""}
    ${signals ? `<div class="api-card"><h2>Signals</h2><ul class="api-list">${signals}</ul></div>` : ""}
    ${consts ? `<div class="api-card"><h2>Constants / Enums</h2><ul class="api-list">${consts}</ul></div>` : ""}
  </section>
</div>`.trim();

    const html = await page(`${esc(display)} — API`, body);
    await fs.writeFile(path.join(OUTPUT_DIR, `${toFileName(rawName)}.html`), html, "utf8");
  }

  const items = classes
    .sort((a, b) => a.display.localeCompare(b.display))
    .map(c =>
      `<li><a href="./${toFileName(c.raw)}.html"><strong>${esc(c.display)}</strong></a>${c.inherits ? ` <span class="small">: ${esc(c.inherits)}</span>` : ""}</li>`
    )
    .join("");

  const indexBody = `
<div class="api-card">
  <form class="api-index-header">
    <input id="api-input" class="api-input" placeholder="Search…"/>
    <button type="reset" class="button blue api-input-reset">Clear</button>
  </form>
  <ul id="list" class="api-list" style="margin-top:10px">${items}</ul>
</div>
<script>
  const inp = document.getElementsByClassName('api-input')[0];
  const clearBtn = document.getElementsByClassName('api-input-reset')[0];
  const list = [...document.querySelectorAll('#list li')];

  function filterList() {
    const s = inp.value.toLowerCase();
    for (const li of list) {
      li.style.display = li.textContent.toLowerCase().includes(s) ? '' : 'none';
    }
  }

  function resetList(ev) {
    // allow the form reset to clear the input, then filter
    setTimeout(filterList, 0);
  }

  inp.addEventListener('input', filterList);
  clearBtn.addEventListener('click', resetList);
</script>`.trim();

  const indexHtml = await page("API Index", indexBody);
  await fs.writeFile(path.join(OUTPUT_DIR, "index.html"), indexHtml, "utf8");

  await fs.writeFile(
    path.join(OUTPUT_DIR, "manifest.json"),
    JSON.stringify(
      {
        classes: classes
          .sort((a, b) => a.display.localeCompare(b.display))
          .map(c => ({name: c.display, inherits: c.inherits, file: `${toFileName(c.raw)}.html`})),
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`✅ Converted ${classes.length} classes → ${path.join(OUTPUT_DIR, "index.html")}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
