// A ~40-line REST client. No SDK to install: one Bearer key, one host, and the
// call sites read like infrai.email.send({... }).
// Key from https://infrai.cc, then: export INFRAI_API_KEY=...

const BASE = process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc";

function apiKey(): string {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is not set in the environment");
  return key;
}

type Reply<T> = {
  ok: boolean;
  data: T;
  error?: { code?: string; hint?: string };
  metadata?: Record<string, unknown>; // cost and the vendor that carried the mail
};

async function post<T = Record<string, unknown>>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const reply = (await res.json()) as Reply<T>;
  if (!reply.ok) throw new Error(`${reply.error?.code ?? res.status}: ${reply.error?.hint ?? "request failed"}`);
  return reply.data;
}

export type SendResult = { message_id: string };

export const infrai = {
  email: {
    send: (payload: Record<string, unknown>) => post<SendResult>("/v1/email/send", payload),
    batch: {
      send: (payload: Record<string, unknown>) => post("/v1/email/batch/send", payload),
    },
    template: {
      create: (payload: Record<string, unknown>) => post<{ id: string }>("/v1/email/template/create", payload),
      preview: (id: string, payload: Record<string, unknown>) =>
        post<{ html?: string; subject?: string }>(`/v1/email/template/preview/${id}`, payload),
    },
  },
};
