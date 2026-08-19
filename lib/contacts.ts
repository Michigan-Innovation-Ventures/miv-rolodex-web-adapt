/**
 * lib/contacts.ts — single source of truth for contact operations.
 *
 * Invariants (must stay in lockstep with scripts/ingest.py + supabase_contacts.py):
 *   1. contact_id = `${name}_${company}` lowercased, spaces → underscores.
 *      Used as BOTH the Pinecone vector id and the Supabase contact_id column.
 *   2. Embedding text = "Name/Title/Company/Expertise/Bio" lines, in that order.
 *   3. Every write goes to Pinecone AND Supabase; every delete removes both.
 *   4. Every operation is scoped to user_id (Pinecone metadata filter,
 *      Supabase WHERE clause). One user can never see another's contacts.
 */

import { embed } from "@/lib/llm";
import { pineconeIndex } from "@/lib/pinecone";
import { supabase, CONTACTS_TABLE } from "@/lib/supabase";
import type { Contact, ContactFields, SearchResult } from "@/types/contact";

const TOP_K = 5;

export function createContactId(name: string, company: string): string {
  const clean = (s: string) => (s || "unknown").toLowerCase().replace(/ /g, "_");
  return `${clean(name)}_${clean(company)}`;
}

/** Must match build_embedding_text() in ingest.py exactly. */
export function buildEmbeddingText(c: ContactFields): string {
  const parts: string[] = [];
  if (c.name) parts.push(`Name: ${c.name}`);
  if (c.title) parts.push(`Title: ${c.title}`);
  if (c.company) parts.push(`Company: ${c.company}`);
  if (c.expertise) parts.push(`Expertise: ${c.expertise}`);
  if (c.bio) parts.push(`Bio: ${c.bio}`);
  return parts.join("\n");
}

/** Embed + write to Pinecone and Supabase. Returns the shared contact_id. */
export async function upsertContact(userId: string, fields: ContactFields): Promise<string> {
  const contactId = createContactId(fields.name, fields.company);
  const vector = await embed(buildEmbeddingText(fields));

  await pineconeIndex().upsert([
    {
      id: `${userId}:${contactId}`, // namespaced per user so two users can hold the same person
      values: vector,
      metadata: { user_id: userId, contact_id: contactId, ...fields },
    },
  ]);

  const row = { user_id: userId, contact_id: contactId, ...fields };
  const { error } = await supabase()
    .from(CONTACTS_TABLE)
    .upsert(row, { onConflict: "user_id,contact_id" });
  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);

  return contactId;
}

export async function listContacts(userId: string): Promise<Contact[]> {
  const { data, error } = await supabase()
    .from(CONTACTS_TABLE)
    .select("contact_id, name, title, company, email, expertise, bio, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Supabase list failed: ${error.message}`);
  return (data ?? []) as Contact[];
}

export async function deleteContact(userId: string, contactId: string): Promise<void> {
  await pineconeIndex().deleteMany([`${userId}:${contactId}`]);
  const { error } = await supabase()
    .from(CONTACTS_TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("contact_id", contactId);
  if (error) throw new Error(`Supabase delete failed: ${error.message}`);
}

/** Embed the query and return the user's top-k matches from Pinecone. */
export async function searchContacts(userId: string, query: string): Promise<SearchResult[]> {
  const queryVector = await embed(query);
  const res = await pineconeIndex().query({
    vector: queryVector,
    topK: TOP_K,
    includeMetadata: true,
    filter: { user_id: { $eq: userId } },
  });

  return (res.matches ?? []).map((m) => {
    const md = (m.metadata ?? {}) as Record<string, string>;
    return {
      id: md.contact_id ?? m.id,
      score: Math.round((m.score ?? 0) * 10000) / 10000,
      name: md.name ?? "Unknown",
      title: md.title ?? "",
      company: md.company ?? "",
      email: md.email ?? "",
      expertise: md.expertise ?? "",
      bio: md.bio ?? "",
    };
  });
}

/** Format retrieved contacts for the LLM prompt — same layout as search.py. */
export function formatContactsForLlm(contacts: SearchResult[]): string {
  return contacts
    .map(
      (c, i) =>
        `Contact ${i + 1} (relevance score: ${c.score}):\n` +
        `  Name: ${c.name}\n  Title: ${c.title}\n  Company: ${c.company}\n` +
        `  Email: ${c.email}\n  Expertise: ${c.expertise}\n  Bio: ${c.bio}`
    )
    .join("\n\n");
}
