import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { deleteContact } from "@/lib/contacts";

/** DELETE /api/contacts/:id — removes from both Pinecone and Supabase. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    await deleteContact(userId, params.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
