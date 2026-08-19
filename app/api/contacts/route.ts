import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { listContacts, upsertContact } from "@/lib/contacts";
import type { ContactFields } from "@/types/contact";

/** GET /api/contacts — all contacts for the signed-in user. */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const contacts = await listContacts(userId);
    return NextResponse.json({ contacts });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** POST /api/contacts — add or update a contact (writes Pinecone + Supabase). */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json()) as Partial<ContactFields>;
  if (!body.name?.trim() || !body.company?.trim()) {
    return NextResponse.json({ error: "Name and company are required" }, { status: 400 });
  }

  const fields: ContactFields = {
    name: body.name.trim(),
    title: body.title?.trim() ?? "",
    company: body.company.trim(),
    email: body.email?.trim() ?? "",
    expertise: body.expertise?.trim() ?? "",
    bio: body.bio?.trim() ?? "",
  };

  try {
    const contact_id = await upsertContact(userId, fields);
    return NextResponse.json({ success: true, contact_id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
