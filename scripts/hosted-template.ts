// The other route: render the component tree once with mustache tokens standing
// in for the values, store that as a hosted template, then send by id.
// Handy when the same markup goes to a list and you only want the values on the wire.
// INFRAI_API_KEY=... npm run hosted -- you@example.com

import { infrai } from "../src/infrai";
import { sendHosted, sendHostedBatch, toHtml } from "../src/mailer";
import { teamInvite } from "../src/templates";

const to = process.argv[2];
if (!to) {
  console.error("usage: npm run hosted -- recipient@example.com");
  process.exit(1);
}

// Props are strings, so a mustache token is a perfectly legal value. Rendering
// with tokens gives markup that is identical to the real thing minus the data.
const skeleton = teamInvite({
  inviter: "{{inviter}}",
  workspace: "{{workspace}}",
  acceptUrl: "{{accept_url}}",
  expiresInHours: 48,
});

const template = await infrai.email.template.create({
  name: "team-invite",
  subject: "{{inviter}} added you to {{workspace}}",
  html: toHtml(skeleton),
});
console.log(`template id: ${template.template_id}`);

const vars = {
  inviter: "Dana",
  workspace: "Northwind",
  accept_url: "https://app.example.com/invite/9f2a1c",
};

// Check the substitution server-side before any address is involved.
const preview = await infrai.email.template.preview(template.template_id, { vars });
console.log(`preview subject: ${preview.rendered_subject ?? "(unchanged)"}`);
console.log(`preview html: ${(preview.rendered_html ?? "").length} chars`);

const sent = await sendHosted(to, template.template_id, vars);
console.log(`single send message_id: ${sent.message_id}`);

// Same template, one call, different values per row.
const batch = await sendHostedBatch(template.template_id, [
  { to, vars },
  { to, vars: {...vars, inviter: "Kim", workspace: "Contoso" } },
]);
console.log("batch accepted:", batch);
