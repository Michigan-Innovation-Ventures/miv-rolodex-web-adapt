# Rolodex — Web App

Next.js frontend for the MIV Rolodex: AI-powered semantic contact search for the fund. Replicates the Python CLI pipeline (ingest.py / search.py / supabase_contacts.py) as API routes, with Google SSO, a conversational search UI, and full contact management.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your keys
ollama serve                 # in another terminal (dev mode uses local Ollama)
ollama pull nomic-embed-text && ollama pull llama3
npm run dev                  # http://localhost:3000
```

**Google OAuth:** in Google Cloud Console → Credentials, create an OAuth client with redirect URI `http://localhost:3000/api/auth/callback/google`.

**Pinecone:** index dimensions must match the embedding model — `768` for Ollama (nomic-embed-text), `1536` for OpenAI (text-embedding-3-small).

## Switching Ollama → OpenAI

One env change, zero code changes:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

Then **recreate the Pinecone index at 1536 dimensions and re-add contacts** — vectors from different embedding models are incompatible. (This is also why Ollama-only dev can't deploy to Vercel: Vercel can't reach your localhost Ollama.)

## Architecture

```
app/
  page.tsx                     Login (Google SSO)
  dashboard/page.tsx           Conversational search
  contacts/page.tsx            Contact ledger (add / edit / delete)
  api/auth/[...nextauth]/      NextAuth handler
  api/contacts/route.ts        GET list · POST upsert (Pinecone + Supabase)
  api/contacts/[id]/route.ts   DELETE (both databases)
  api/contacts/search/route.ts RAG: embed → Pinecone top-5 → LLM answer
lib/
  llm.ts        embed() + chat() with the ollama/openai provider toggle
  contacts.ts   contact_id scheme, embedding text, dual-DB writes, scoped search
  auth.ts       NextAuth config; derives a stable UUID user_id from email
  pinecone.ts / supabase.ts / prompts.ts
components/     SearchChat, ContactManager, ResultCard, Nav, auth buttons
middleware.ts   Protects /dashboard, /contacts, /api/contacts
```

## Invariants (kept in lockstep with the Python scripts)

- **contact_id** = `{name}_{company}`, lowercased, spaces → underscores. Same value in Supabase (`contact_id` column) and inside Pinecone metadata.
- **Embedding text** = `Name / Title / Company / Expertise / Bio` lines, identical to `build_embedding_text()` in ingest.py.
- **Same model everywhere** — contacts and queries always embed with the active provider's model.
- **User scoping** — every Pinecone query filters `user_id`, every Supabase query has `WHERE user_id = ?`. Pinecone vector ids are namespaced `{user_id}:{contact_id}` so two members can each keep the same person.
- **Server-only secrets** — Supabase service-role key and API keys live in API routes; nothing sensitive reaches the browser.

## Notes for the team

- **user_id:** the Supabase schema wants a UUID, but Google SSO gives an email — `lib/auth.ts` derives a deterministic UUIDv5 from the email, so no schema change and no extra table. To share one rolodex across the whole fund later, swap `userIdFromEmail(email)` for a fixed fund UUID (or a domain-derived one) in one place.
- **CLI-ingested vectors** don't carry `user_id` metadata, so they won't appear in the web app's scoped searches. Re-add them through the UI, or backfill metadata with a small script.
- **Renaming a contact** changes its contact_id; the UI handles this by upserting the new id and deleting the old one from both stores.
