import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { formatContactsForLlm, searchContacts } from "@/lib/contacts";
import { chat, type LlmMessage } from "@/lib/llm";
import { SEARCH_SYSTEM_PROMPT } from "@/lib/prompts";
import type { ChatMessage } from "@/types/contact";

/**
 * POST /api/contacts/search — RAG pipeline, mirroring scripts/search.py:
 * embed query → Pinecone top-5 (scoped to user) → LLM recommendation.
 * chatHistory lets follow-ups ("what about someone more technical?") build on
 * earlier turns.
 */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { query, chatHistory = [] } = (await req.json()) as {
    query?: string;
    chatHistory?: ChatMessage[];
  };
  if (!query?.trim()) return NextResponse.json({ error: "Query is required" }, { status: 400 });

  try {
    const results = await searchContacts(userId, query.trim());

    if (results.length === 0) {
      return NextResponse.json({
        results,
        aiResponse:
          "Your rolodex is empty — add some contacts first, then I can start matching them to what you need.",
      });
    }

    const history: LlmMessage[] = chatHistory
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    const messages: LlmMessage[] = [
      { role: "system", content: SEARCH_SYSTEM_PROMPT },
      ...history,
      {
        role: "user",
        content:
          `Query: "${query.trim()}"\n\nRetrieved contacts:\n${formatContactsForLlm(results)}\n\n` +
          `Based on these contacts, who is the best match for this query and why?`,
      },
    ];

    const aiResponse = await chat(messages);
    return NextResponse.json({ results, aiResponse });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
