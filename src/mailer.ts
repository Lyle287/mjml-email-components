// Where the component tree meets the wire. Everything above this file is plain
// rendering and can be unit-tested with no key and no network.

import { infrai, type SendResult } from "./infrai";
import { renderDocument } from "./render";
import type { EmailDoc } from "./templates";

export function fromAddress(): string | undefined {
  return process.env.EMAIL_FROM;
}

export function toHtml(doc: EmailDoc): string {
  return renderDocument(doc.body, doc.subject);
}

// Path 1 — render locally, hand over finished HTML.
export function sendRendered(to: string, doc: EmailDoc): Promise<SendResult> {
  const from = fromAddress();
  return infrai.email.send({ to, ...(from ? { from } : {}), subject: doc.subject, html: toHtml(doc) });
}

// Path 2 — the markup already lives server-side; only the values travel.
export function sendHosted(to: string, templateId: string, vars: Record<string, string>): Promise<SendResult> {
  const from = fromAddress();
  return infrai.email.send({ to, ...(from ? { from } : {}), template_id: templateId, template_vars: vars });
}

export interface Recipient {
  to: string;
  vars: Record<string, string>;
}

// One call for a list: same hosted template, different values per row.
export function sendHostedBatch(templateId: string, recipients: Recipient[]) {
  const from = fromAddress();
  return infrai.email.batch.send({
    messages: recipients.map((r) => ({
      to: r.to,
      ...(from ? { from } : {}),
      template_id: templateId,
      template_vars: r.vars,
    })),
  });
}
