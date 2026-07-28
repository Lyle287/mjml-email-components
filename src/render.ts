// Tree -> HTML string. About 60 lines, no build step, no virtual DOM: an email
// is rendered once on the server and never updated, so there is nothing to diff.

import { childrenOf, type Child, type Props } from "./h";

const VOID_TAGS = new Set(["br", "hr", "img", "meta", "link"]);
const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
// Attribute names that differ between JSX habits and real HTML.
const ATTR_ALIAS: Record<string, string> = { className: "class", htmlFor: "for" };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ESCAPES[c]);
}

// { fontSize: "14px", color: "#111" } -> "font-size:14px;color:#111"
function styleToCss(style: Record<string, string | number>): string {
  return Object.entries(style)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}:${v}`)
    .join(";");
}

function attrsToHtml(props: Props): string {
  const out: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (key === "children" || value === null || value === undefined || value === false) continue;
    if (key === "style" && typeof value === "object") {
      out.push(` style="${escapeHtml(styleToCss(value as Record<string, string | number>))}"`);
      continue;
    }
    const name = ATTR_ALIAS[key] ?? key;
    if (value === true) out.push(` ${name}`);
    else out.push(` ${name}="${escapeHtml(String(value))}"`);
  }
  return out.join("");
}

export function render(node: Child | Child[]): string {
  if (node === null || node === undefined || node === false) return "";
  if (Array.isArray(node)) return node.map(render).join("");
  if (typeof node === "string") return escapeHtml(node);
  if (typeof node === "number") return String(node);

  const { type, props } = node;
  if (typeof type === "function") return render(type(props));

  const inner = render(childrenOf(props));
  if (VOID_TAGS.has(type)) return `<${type}${attrsToHtml(props)}>`;
  return `<${type}${attrsToHtml(props)}>${inner}</${type}>`;
}

// What actually goes on the wire: the transitional doctype Outlook wants, plus a
// tiny reset that stops iOS Mail from auto-linking phone numbers.
export function renderDocument(node: Child, title = ""): string {
  return [
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" ',
    '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    '<html xmlns="http://www.w3.org/1999/xhtml"><head>',
    '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    "<style>a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}</style>",
    `<title>${escapeHtml(title)}</title></head>`,
    '<body style="margin:0;padding:0;background:#f4f5f7">',
    render(node),
    "</body></html>",
  ].join("");
}
