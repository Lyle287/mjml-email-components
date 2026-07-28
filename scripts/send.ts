// Renders the invite here and posts the finished HTML.
// INFRAI_API_KEY=... EMAIL_FROM=you@yourdomain npm run send -- you@example.com

import { sendRendered } from "../src/mailer";
import { teamInvite } from "../src/templates";

const to = process.argv[2];
if (!to) {
  console.error("usage: npm run send -- recipient@example.com");
  process.exit(1);
}

const doc = teamInvite({
  inviter: "Dana",
  workspace: "Northwind",
  acceptUrl: "https://app.example.com/invite/9f2a1c",
  expiresInHours: 48,
});

const result = await sendRendered(to, doc);
console.log(`queued ${doc.subject} -> ${to}`);
console.log(`message_id: ${result.message_id}`);
