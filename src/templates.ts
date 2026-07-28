// Two templates a small product actually sends. Each is a function of typed
// props to { subject, body }, so the subject line and the markup stay together
// and TypeScript complains before the send does.

import { h, type Element } from "./h";
import { Body, Button, Columns, Divider, Footer, Heading, KeyValue, Section, Text } from "./components";

export interface EmailDoc {
  subject: string;
  body: Element;
}

export interface InviteProps {
  inviter: string;
  workspace: string;
  acceptUrl: string;
  expiresInHours: number;
}

export function teamInvite(p: InviteProps): EmailDoc {
  return {
    subject: `${p.inviter} added you to ${p.workspace}`,
    body: h(
      Body,
      null,
      h(
        Section,
        null,
        h(Heading, null, `Join ${p.workspace}`),
        h(Text, null, `${p.inviter} invited you as a member. The link below signs you in and drops you straight into the workspace.`),
        h(Button, { href: p.acceptUrl }, "Accept the invite"),
        h(Text, { muted: true }, `The link stops working after ${p.expiresInHours} hours. Ask ${p.inviter} for a fresh one if you miss it.`),
      ),
      h(Footer, null, "You are getting this because someone typed your address into an invite box."),
    ),
  };
}

export interface UsageProps {
  workspace: string;
  periodLabel: string;
  rows: [string, string][];
  spendUsd: string;
  dashboardUrl: string;
}

export function usageSummary(p: UsageProps): EmailDoc {
  return {
    subject: `${p.workspace}: ${p.periodLabel} usage`,
    body: h(
      Body,
      null,
      h(
        Section,
        null,
        h(Heading, null, `${p.periodLabel} on ${p.workspace}`),
        h(Text, null, "Here is what the workspace used. Numbers are final; nothing below is an estimate."),
        h(KeyValue, { rows: p.rows }),
        h(Divider, null),
        h(
          Columns,
          null,
          h(Text, null, `Spend: $${p.spendUsd}`),
          h(Text, { muted: true }, "Billed at the end of the period."),
        ),
        h(Button, { href: p.dashboardUrl }, "Open the dashboard"),
      ),
      h(Footer, null, "Turn this summary off from workspace settings."),
    ),
  };
}
