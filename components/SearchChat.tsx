"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, SearchResult } from "@/types/contact";
import ResultCard from "@/components/ResultCard";

const SUGGESTIONS = [
  "Who can assess an AI chip design?",
  "Help a log management company increase sales",
  "A marketing lead for in-game advertising",
];

export default function SearchChat({ firstName }: { firstName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send(query: string) {
    const q = query.trim();
    if (!q || loading) return;

    setError(null);
    setInput("");
    const history = messages;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);

    try {
      const res = await fetch("/api/contacts/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, chatHistory: history }),
      });
      const data: { results?: SearchResult[]; aiResponse?: string; error?: string } =
        await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");

      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.aiResponse ?? "", results: data.results ?? [] },
      ]);
    } catch (e) {
      setError((e as Error).message);
      setMessages((m) => m.slice(0, -1)); // roll back the unanswered turn
      setInput(q);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-10 md:px-12">
        <div className="mx-auto max-w-2xl">
          {messages.length === 0 ? (
            <Empty firstName={firstName} onPick={send} />
          ) : (
            <div className="flex flex-col gap-8">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <p
                    key={i}
                    className="self-end rounded-sm bg-ink px-4 py-2.5 text-sm text-card"
                  >
                    {m.content}
                  </p>
                ) : (
                  <div key={i} className="flex flex-col gap-5">
                    {m.content && (
                      <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                        {m.content}
                      </div>
                    )}
                    {m.results && m.results.length > 0 && (
                      <div className="flex flex-col gap-5 pt-2">
                        {m.results.map((r, j) => (
                          <ResultCard key={r.id} result={r} rank={j + 1} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
              {loading && (
                <p className="font-mono text-xs text-muted" aria-live="polite">
                  Searching the rolodex
                  <span className="dot"> .</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </p>
              )}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-line bg-paper px-6 py-4 md:px-12">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto flex max-w-2xl items-center gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              messages.length === 0
                ? "Describe who you need — in plain language"
                : "Refine the search or ask a follow-up"
            }
            aria-label="Search your contacts"
            className="flex-1 rounded-sm border border-line bg-card px-4 py-3 text-sm placeholder:text-muted focus:border-ink"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-sm bg-oxblood px-5 py-3 text-sm font-medium text-card transition-colors hover:bg-oxblood-deep disabled:opacity-40"
          >
            Ask
          </button>
        </form>
        {error && (
          <p role="alert" className="mx-auto mt-2 max-w-2xl text-xs text-oxblood">
            {error} — check that Ollama is running (`ollama serve`) and try again.
          </p>
        )}
      </div>
    </div>
  );
}

function Empty({ firstName, onPick }: { firstName: string; onPick: (q: string) => void }) {
  return (
    <div className="pt-16 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        The fund&apos;s network
      </p>
      <h1 className="mt-3 font-display text-5xl">Who do you need, {firstName}?</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
        Describe a problem, a deal, or a skill. Rolodex reads every bio in the fund&apos;s
        network and tells you exactly who to call — and why.
      </p>
      <div className="mt-10 flex flex-col items-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-sm border border-line bg-card px-4 py-2 text-sm text-ink/80 transition-colors hover:border-oxblood hover:text-oxblood"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
