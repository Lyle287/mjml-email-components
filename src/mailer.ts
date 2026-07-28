// Where the component tree meets the wire. Everything above this file is plain
// rendering and can be unit-tested with no key and no network.

import { infrai, type SendResult } from "./infrai";
import { renderDocument } from "./render";
import type { EmailDoc } from "./templates";

export function fromAddress(): string {
  // Has to be a domain you verified for the key; see the README.
  return process.env.EMAIL_FROM ?? "noreply@example.com";
}

export function toHtml(doc: EmailDoc): string {
  return renderDocument(doc.body, doc.subject);
}

// Path 1 — render locally, hand over finished HTML.
export function sendRendered(to: string, doc: EmailDoc): Promise<SendResult> {
  return infrai.email.send({ to, from: fromAddress(), subject: doc.subject, html: toHtml(doc) });
}

// Path 2 — the markup already lives server-side; only the values travel.
export function sendHosted(to: string, templateId: string, vars: Record<string, string>): Promise<SendResult> {
  return infrai.email.send({ to, from: fromAddress(), template_id: templateId, template_vars: vars });
}

export interface Recipient {
  to: string;
  vars: Record<string, string>;
}

// One call for a list: same hosted template, different values per row.
export function sendHostedBatch(templateId: string, recipients: Recipient[]) {
  return infrai.email.batch.send({
    messages: recipients.map((r) => ({
      to: r.to,
      from: fromAddress(),
      template_id: templateId,
      template_vars: r.vars,
    })),
  });
}
