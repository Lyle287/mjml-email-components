// The box model MJML gave us — Body > Section > Column > content — expressed as
// components. Each one emits the same nested-table markup MJML compiles down to,
// because that is still what Outlook 2016 and Gmail's clipper agree on.

import { childrenOf, h, type Child, type Element, type Props } from "./h";

export const THEME = {
  ink: "#1a1d21",
  muted: "#6b7280",
  accent: "#2f6fed",
  border: "#e5e7eb",
  page: "#f4f5f7",
  card: "#ffffff",
  font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
  width: 600,
};

// Outer wrapper: a full-bleed table (background colours need a table cell in
// Outlook) holding one centred card of THEME.width.
export function Body(props: Props): Element {
  return h(
    "table",
    { role: "presentation", width: "100%", cellpadding: "0", cellspacing: "0", border: "0", style: { background: THEME.page } },
    h(
      "tr",
      null,
      h(
        "td",
        { align: "center", style: { padding: "24px 12px" } },
        h(
          "table",
          {
            role: "presentation",
            width: String(THEME.width),
            cellpadding: "0",
            cellspacing: "0",
            border: "0",
            style: { width: `${THEME.width}px`, maxWidth: "100%", background: THEME.card, borderRadius: "8px", border: `1px solid ${THEME.border}` },
          },
          childrenOf(props),
        ),
      ),
    ),
  );
}

export function Section(props: Props): Element {
  const padding = (props.padding as string) ?? "24px";
  return h("tr", null, h("td", { style: { padding, fontFamily: THEME.font } }, childrenOf(props)));
}

// Columns stack on narrow screens only if the client honours max-width; treat
// two columns as the practical ceiling.
export function Columns(props: Props): Element {
  const cells = childrenOf(props);
  const width = `${Math.floor(100 / Math.max(cells.length, 1))}%`;
  return h(
    "table",
    { role: "presentation", width: "100%", cellpadding: "0", cellspacing: "0", border: "0" },
    h("tr", null, cells.map((cell: Child) => h("td", { valign: "top", width, style: { verticalAlign: "top" } }, cell))),
  );
}

export function Heading(props: Props): Element {
  return h(
    "h1",
    { style: { margin: "0 0 12px", fontSize: "22px", lineHeight: "1.3", color: THEME.ink, fontFamily: THEME.font } },
    childrenOf(props),
  );
}

export function Text(props: Props): Element {
  const muted = props.muted === true;
  return h(
    "p",
    {
      style: {
        margin: "0 0 12px",
        fontSize: muted ? "13px": "15px",
        lineHeight: "1.55",
        color: muted ? THEME.muted: THEME.ink,
        fontFamily: THEME.font,
      },
    },
    childrenOf(props),
  );
}

// A bulletproof-ish button: a padded table cell, not an <a> with padding, which
// Outlook drops on the floor.
export function Button(props: Props): Element {
  return h(
    "table",
    { role: "presentation", cellpadding: "0", cellspacing: "0", border: "0", style: { margin: "8px 0 4px" } },
    h(
      "tr",
      null,
      h(
        "td",
        { align: "center", style: { background: THEME.accent, borderRadius: "6px" } },
        h(
          "a",
          {
            href: String(props.href ?? "#"),
            style: {
              display: "inline-block",
              padding: "12px 22px",
              fontSize: "15px",
              fontWeight: "600",
              color: "#ffffff",
              textDecoration: "none",
              fontFamily: THEME.font,
            },
          },
          childrenOf(props),
        ),
      ),
    ),
  );
}

export function Divider(_props: Props): Element {
  return h("div", { style: { height: "1px", background: THEME.border, margin: "16px 0" } });
}

export function KeyValue(props: Props): Element {
  const rows = (props.rows as [string, string][]) ?? [];
  return h(
    "table",
    { role: "presentation", width: "100%", cellpadding: "0", cellspacing: "0", border: "0", style: { fontFamily: THEME.font } },
    rows.map(([label, value]: [string, string]) =>
      h(
        "tr",
        null,
        h("td", { style: { padding: "6px 0", fontSize: "14px", color: THEME.muted } }, label),
        h("td", { align: "right", style: { padding: "6px 0", fontSize: "14px", color: THEME.ink } }, value),
      ),
    ),
  );
}

export function Footer(props: Props): Element {
  return h(
    "tr",
    null,
    h(
      "td",
      { style: { padding: "0 24px 24px", fontFamily: THEME.font, fontSize: "12px", color: THEME.muted } },
      childrenOf(props),
    ),
  );
}
