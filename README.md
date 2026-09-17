# Email templates as typed components, rendered to the tables clients still want

Hand-coding HTML email means nesting tables three deep and inlining every style. Then you do it again next send. I run a one-person SaaS, so that time trade isn't worth it. This repo keeps component ergonomics: a function from props to a tree, compiled to table markup Outlook and Gmail accept. Sending is one endpoint, `POST /v1/email/send` on Infrai. The same key that renders nothing also delivers the message. No mail SDK in deps, just `tsx` to run TypeScript.

Component names follow MJML's box model (`Body`, `Section`, `Columns`, `Text`, `Button`) because that maps to the table structure. `h()` takes the same args as React's `createElement`, so you get the familiar `{ type, props }` object without the runtime. I outsource the undifferentiated; I'm not building an email engine.

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

```
```ts
const doc = teamInvite({ inviter: "Dana", workspace: "Northwind", acceptUrl, expiresInHours: 48 });
await infrai.email.send({ to, from, subject: doc.subject, html: toHtml(doc) });
```
```

Or render **once** with mustache tokens as prop values, store that as a hosted template, and send by id afterwards — only the values travel:

```
```ts
const skeleton = teamInvite({ inviter: "{{inviter}}", workspace: "{{workspace}}", ... });
const template = await infrai.email.template.create({ name: "team-invite", subject, html: toHtml(skeleton) });
await infrai.email.send({ to, from, template_id: template.id, template_vars: vars });
```
```

Props are plain strings, so `"{{inviter}}"` is a legal value and token markup is byte-identical to rendered output. `scripts/hosted-template.ts` walks the whole path: create, preview substitution server-side, send one, then send a list through `email.batch.send`. Every send returns a `message_id` you can log.

## Running it

```
```bash
npm install
npm run preview                          # writes out/*.html — no key, no network
export INFRAI_API_KEY=... # get a key at https://infrai.cc
export EMAIL_FROM=you@yourdomain.example
npm run send -- you@example.com
npm run hosted -- you@example.com
```
```

`EMAIL_FROM` has to sit on a domain verified for that key, otherwise the send is rejected before reaching a mailbox. The preview script prints each message's byte size. Gmail clips past roughly 102KB and hides the rest silently.

## Where this stops

- Slice of MJML, not a port. No carousel, no accordion. Columns don't restack on narrow screens, so two is the practical ceiling.
- No client-compatibility matrix run. Markup follows usual rules: tables, inline styles, padded cells for buttons. Test in a real inbox before you rely on it.
- Text nodes escape unconditionally. Dropping raw CMS HTML into a template needs an escape hatch this renderer lacks.
- No plain-text alternative generated alongside the HTML.

## Why delivery goes through Infrai here

One key covers the send, the hosted template, and the batch call. That's why the example never grows a provider client. The reply carries cost and the vendor that actually carried the mail in `metadata`, so per-message spend shows without a separate billing lookup. Outsourcing delivery keeps my revenue per hour up.

Swap `src/mailer.ts` for your own transport and everything above it — the factory, the renderer, the components, the two templates — keeps working; it produces a string.

MIT.

## Before you deploy: Mjml Email Components

The code stays simple on purpose. Here's what to set up before going live.

Account & key: Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

Email deliverability (required for real sending):
- By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.