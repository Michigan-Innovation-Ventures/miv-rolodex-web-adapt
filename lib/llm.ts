/**
 * lib/llm.ts — provider-agnostic embed() and chat().
 *
 * Mirrors the EMBEDDING_PROVIDER / LLM_PROVIDER toggles in the Python CLI
 * scripts. Switching providers is config only: set LLM_PROVIDER in .env.
 *
 *   ollama → nomic-embed-text (768 dims) + llama3
 *   openai → text-embedding-3-small (1536 dims) + gpt-4o
 *
 * The Pinecone index dimensions must match the active embedding model.
 */

type Role = "system" | "user" | "assistant";
export interface LlmMessage {
  role: Role;
  content: string;
}

const PROVIDER = process.env.LLM_PROVIDER === "openai" ? "openai" : "ollama";
const OLLAMA_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

const MODELS = {
  ollama: { embed: "nomic-embed-text", chat: "llama3" },
  openai: { embed: "text-embedding-3-small", chat: "gpt-4o" },
} as const;

export const llmProvider = PROVIDER;

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${url} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

function openaiHeaders() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set but LLM_PROVIDER=openai");
  return { Authorization: `Bearer ${key}` };
}

/** Embed a single string. Same model must be used for contacts and queries. */
export async function embed(text: string): Promise<number[]> {
  if (PROVIDER === "openai") {
    const data = await postJson(
      "https://api.openai.com/v1/embeddings",
      { model: MODELS.openai.embed, input: text },
      openaiHeaders()
    );
    return data.data[0].embedding;
  }
  const data = await postJson(`${OLLAMA_URL}/api/embed`, {
    model: MODELS.ollama.embed,
    input: text,
  });
  return data.embeddings[0];
}

/** Chat completion. temperature 0.3, matching search.py. */
export async function chat(messages: LlmMessage[]): Promise<string> {
  if (PROVIDER === "openai") {
    const data = await postJson(
      "https://api.openai.com/v1/chat/completions",
      { model: MODELS.openai.chat, messages, temperature: 0.3, max_tokens: 1000 },
      openaiHeaders()
    );
    return data.choices[0].message.content;
  }
  const data = await postJson(`${OLLAMA_URL}/api/chat`, {
    model: MODELS.ollama.chat,
    messages,
    stream: false,
    options: { temperature: 0.3 },
  });
  return data.message.content;
}
