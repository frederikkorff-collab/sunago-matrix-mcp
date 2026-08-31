#!/usr/bin/env node
/*
 * Generates TOOLS.md from data/tools.json.
 *
 * data/tools.json is a copy of the file the product repo generates from the
 * server's own tool definitions and the permission gate each handler runs, so
 * this reference is a rendering of the server rather than a description of it.
 *
 *   node scripts/build-tools-md.mjs            write TOOLS.md
 *   node scripts/build-tools-md.mjs --check    fail if TOOLS.md is stale
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/tools.json"), "utf8"));
const OUT = path.join(ROOT, "TOOLS.md");
const check = process.argv.includes("--check");

const byName = new Map(data.tools.map((t) => [t.name, t]));

const access = (t) => (t.readOnly ? "read" : "write");

function flags(t) {
  const out = [];
  if (t.destructive) out.push("deletes");
  if (t.needsAdmin) out.push("admin only");
  if (t.needsConfirmation) out.push("confirmation required");
  return out.join(", ");
}

function permissions(t) {
  if (t.dynamicPermission) {
    return `\`<parent>.${t.dynamicPermission}\``;
  }
  if (!t.permissions.length) return "none";
  return t.permissions.map((p) => `\`${p.feature}.${p.action}\``).join(", ");
}

const lines = [];

lines.push("# Tool reference");
lines.push("");
lines.push(
  `All ${data.counts.total} tools the server publishes, exactly as a connected client receives them. ` +
    "This file is generated from the server's own definitions; see [CONTRIBUTING](#keeping-this-file-honest) below.",
);
lines.push("");
lines.push("| | |");
lines.push("| --- | --- |");
lines.push(`| Tools | ${data.counts.total} |`);
lines.push(`| Read-only | ${data.counts.readOnly} |`);
lines.push(`| Can write | ${data.counts.write} |`);
lines.push(`| Can delete | ${data.counts.destructive} |`);
lines.push(`| Require a confirmation phrase | ${data.counts.needsConfirmation} |`);
lines.push(`| Behind a finance permission | ${data.counts.financeGated} |`);
lines.push("");
lines.push(
  "The **Permission** column is the check the handler runs before it does anything. " +
    "It is the same permission the SUNAGO Matrix interface checks, so a tool can do exactly " +
    "what the signed-in user can already do by hand and nothing more. " +
    "Tools listing `none` are gated by row-level security alone: they act only on the caller's own records.",
);
lines.push("");
lines.push("## Contents");
lines.push("");
for (const g of data.groups) {
  lines.push(`- [${g.label}](#${g.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}) (${g.tools.length})`);
}
lines.push("");

for (const g of data.groups) {
  const tools = g.tools.map((n) => byName.get(n)).filter(Boolean);
  lines.push(`## ${g.label}`);
  lines.push("");
  lines.push(g.blurb);
  lines.push("");
  lines.push("| Tool | Access | Permission | Notes |");
  lines.push("| --- | --- | --- | --- |");
  for (const t of tools) {
    lines.push(
      `| \`${t.name}\` | ${access(t)} | ${permissions(t)} | ${flags(t) || ""} |`,
    );
  }
  lines.push("");
  for (const t of tools) {
    if (t.summary) lines.push(`- **\`${t.name}\`** ${t.summary}`);
  }
  lines.push("");
}

lines.push("## Keeping this file honest");
lines.push("");
lines.push(
  "`data/tools.json` is generated in the product repository from the live tool definitions and " +
    "the permission gate in each handler, and copied here. `TOOLS.md` is rendered from it by " +
    "`scripts/build-tools-md.mjs`. Nothing in this file is written by hand, so a tool that changes " +
    "in the server changes here rather than quietly disagreeing with it.",
);
lines.push("");
lines.push("```bash");
lines.push("node scripts/build-tools-md.mjs --check   # fails if TOOLS.md is stale");
lines.push("```");
lines.push("");

const markdown = `${lines.join("\n")}`;
const existing = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : null;

if (check) {
  if (existing !== markdown) {
    console.error("TOOLS.md is stale. Run: node scripts/build-tools-md.mjs");
    process.exit(1);
  }
  console.log(`TOOLS.md is up to date (${data.counts.total} tools).`);
} else {
  fs.writeFileSync(OUT, markdown, "utf8");
  console.log(`Wrote TOOLS.md - ${data.counts.total} tools in ${data.groups.length} groups.`);
}
