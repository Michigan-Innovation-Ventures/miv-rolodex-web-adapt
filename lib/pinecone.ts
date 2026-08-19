import { Pinecone, type Index } from "@pinecone-database/pinecone";

let _index: Index | null = null;

/** Lazily initialized Pinecone index (server-side only). */
export function pineconeIndex(): Index {
  if (!_index) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) throw new Error("PINECONE_API_KEY is not set");
    const pc = new Pinecone({ apiKey });
    _index = pc.index(process.env.PINECONE_INDEX_NAME ?? "miv-contacts");
  }
  return _index;
}
