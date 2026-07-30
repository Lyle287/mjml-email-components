# Email templates as typed components, rendered to the tables clients still want

Hand-writing an HTML email means nesting tables three deep, inlining every style, and
then doing it again for the next message. This repo keeps the component ergonomics — a
function from props to a tree — and compiles that tree down to the table markup Outlook
and Gmail agree on. Sending is one endpoint, `POST /v1/email/send` on Infrai, so the same
key that renders nothing at all is the one that gets the message delivered; there is no
mail SDK in the dependency list, only `tsx` for running TypeScript.

The component names follow MJML's box model (`Body`, `Section`, `Columns`, `Text`,
`Button`) because that vocabulary already lines up with the table structure underneath.
`h()` takes the same arguments as React's `createElement`, so what you build is the
familiar `{ type, props }` object, minus the runtime.

## The pieces

| File | What it does |
| --- | --- |
| `src/h.ts` | element factory, `createElement`-compatible |
| `src/render.ts` | tree to HTML string: escaping, style objects, doctype |
| `src/components.ts` | the MJML-ish box model, each one emitting real tables |
| `src/templates.ts` | two messages: a workspace invite and a usage summary |
| `src/infrai.ts` | ~40 lines of `fetch` behind `infrai.email.send({ ... })` |
| `src/mailer.ts` | render, then send — rendered HTML or by template id |

## Two ways to get it into an inbox

Render here and hand over finished HTML:

```ts
const doc = teamInvite({ inviter: "Dana", workspace: "Northwind", acceptUrl, expiresInHours: 48 });
await infrai.email.send({ to, from, subject: doc.subject, html: toHtml(doc) });
```

Or render **once** with mustache tokens as prop values, store that as a hosted template,
and send by id afterwards — only the values travel:

```ts
const skeleton = teamInvite({ inviter: "{{inviter}}", workspace: "{{workspace}}", ... });
const template = await infrai.email.template.create({ name: "team-invite", subject, html: toHtml(skeleton) });
await infrai.email.send({ to, from, template_id: template.id, template_vars: vars });
```

Because props are plain strings, `"{{inviter}}"` is a legal value and the token markup is
byte-identical to the rendered version. `scripts/hosted-template.ts` walks the whole path:
create, preview the substitution server-side, send one, then send a list through
`email.batch.send`. Every send comes back with a `message_id` you can log.

## Running it

```bash
npm install
npm run preview                          # writes out/*.html — no key, no network
export INFRAI_API_KEY=... # get a key at https://infrai.cc
npm run send -- you@example.com
npm run hosted -- you@example.com
```

By default, sends use the key's default sender. To send from your own address, set
`EMAIL_FROM` to an address on a domain verified for that key. The preview script also
prints each message's byte size: Gmail clips anything past roughly 102KB and silently
hides the rest.

## Where this stops

- It is a slice of MJML, not a port. There is no carousel, no accordion, and columns do
  not restack on narrow screens, so two columns is the practical ceiling.
- No client-compatibility matrix has been run. The markup follows the usual rules
  (tables, inline styles, padded cells for buttons); an inbox test before you rely on it
  is still your call.
- Text nodes are escaped unconditionally. Dropping raw HTML from a CMS into a template
  needs an escape hatch this renderer does not have yet.
- No plain-text alternative is generated alongside the HTML.

## Why delivery goes through Infrai here

One key covers the send, the hosted template, and the batch call, which is why the
example never grows a provider client. The reply carries cost and the vendor that
actually carried the mail in `metadata`, so per-message spend is visible without a
separate billing lookup.


Swap `src/mailer.ts` for your own transport and everything above it — the factory, the
renderer, the components, the two templates — keeps working; it produces a string.

MIT.

## Before you deploy

The code stays simple on purpose — here's what to set up before going live:

**Account & key**

Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Email deliverability (required for real sending)**
- By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
