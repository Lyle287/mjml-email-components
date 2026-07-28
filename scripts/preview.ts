// Offline: renders both templates to out/*.html and reports the byte size.
// Gmail clips a message past ~102KB and hides everything after the cut, so the
// size is worth watching before anything is sent.

import { mkdirSync, writeFileSync } from "node:fs";
import { toHtml } from "../src/mailer";
import { teamInvite, usageSummary, type EmailDoc } from "../src/templates";

const GMAIL_CLIP_BYTES = 102 * 1024;

const samples: Record<string, EmailDoc> = {
  "team-invite": teamInvite({
    inviter: "Dana",
    workspace: "Northwind",
    acceptUrl: "https://app.example.com/invite/9f2a1c",
    expiresInHours: 48,
  }),
  "usage-summary": usageSummary({
    workspace: "Northwind",
    periodLabel: "March",
    rows: [
      ["Messages sent", "12,480"],
      ["Bounced", "31"],
      ["Seats in use", "7 of 10"],
    ],
    spendUsd: "18.40",
    dashboardUrl: "https://app.example.com/usage",
  }),
};

mkdirSync("out", { recursive: true });
for (const [name, doc] of Object.entries(samples)) {
  const html = toHtml(doc);
  const bytes = Buffer.byteLength(html, "utf8");
  writeFileSync(`out/${name}.html`, html);
  const flag = bytes > GMAIL_CLIP_BYTES ? "over the Gmail clip limit": "under the clip limit";
  console.log(`out/${name}.html ${bytes} bytes (${flag}) subject: ${doc.subject}`);
}
console.log("Open the files in a browser, or paste one into a client tester.");
