"use client";

import { useCallback, useEffect, useState } from "react";
import type { Contact, ContactFields } from "@/types/contact";

const BLANK: ContactFields = { name: "", title: "", company: "", email: "", expertise: "", bio: "" };

export default function ContactManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ContactFields | null>(null); // null = form closed
  const [editingId, setEditingId] = useState<string | null>(null); // set = editing existing
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load contacts");
      setContacts(data.contacts);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function save(fields: ContactFields) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      // Renaming a contact changes its contact_id — remove the old record.
      if (editingId && editingId !== data.contact_id) {
        await fetch(`/api/contacts/${encodeURIComponent(editingId)}`, { method: "DELETE" });
      }

      setEditing(null);
      setEditingId(null);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(contact: Contact) {
    if (!confirm(`Remove ${contact.name} from the rolodex? This deletes the search index too.`))
      return;
    setError(null);
    try {
      const res = await fetch(`/api/contacts/${encodeURIComponent(contact.contact_id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-12">
      <header className="flex items-end justify-between border-b border-line pb-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Ledger</p>
          <h1 className="mt-1 font-display text-4xl">Contacts</h1>
        </div>
        <button
          onClick={() => {
            setEditing(BLANK);
            setEditingId(null);
          }}
          className="rounded-sm bg-oxblood px-4 py-2 text-sm font-medium text-card transition-colors hover:bg-oxblood-deep"
        >
          Add contact
        </button>
      </header>

      {error && (
        <p role="alert" className="mt-4 text-sm text-oxblood">
          {error}
        </p>
      )}

      {editing && (
        <ContactForm
          initial={editing}
          isEdit={editingId !== null}
          saving={saving}
          onSave={save}
          onCancel={() => {
            setEditing(null);
            setEditingId(null);
          }}
        />
      )}

      <section className="mt-6">
        {loading ? (
          <p className="font-mono text-xs text-muted">Loading the ledger…</p>
        ) : contacts.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">
            The ledger is empty. Add your first contact — search gets smarter with every entry.
          </p>
        ) : (
          <ul>
            {contacts.map((c) => (
              <li key={c.contact_id} className="ledger-row flex items-baseline gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-display text-xl">{c.name}</span>
                    <span className="font-mono text-[11px] text-muted">{c.contact_id}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {[c.title, c.company].filter(Boolean).join(" · ")}
                    {c.email ? ` — ${c.email}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3 font-mono text-[11px] uppercase tracking-[0.15em]">
                  <button
                    onClick={() => {
                      setEditing({
                        name: c.name,
                        title: c.title ?? "",
                        company: c.company ?? "",
                        email: c.email ?? "",
                        expertise: c.expertise ?? "",
                        bio: c.bio ?? "",
                      });
                      setEditingId(c.contact_id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-muted hover:text-ink"
                  >
                    Edit
                  </button>
                  <button onClick={() => remove(c)} className="text-muted hover:text-oxblood">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ContactForm({
  initial,
  isEdit,
  saving,
  onSave,
  onCancel,
}: {
  initial: ContactFields;
  isEdit: boolean;
  saving: boolean;
  onSave: (f: ContactFields) => void;
  onCancel: () => void;
}) {
  const [fields, setFields] = useState<ContactFields>(initial);
  const set = (k: keyof ContactFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  const inputCls =
    "w-full rounded-sm border border-line bg-card px-3 py-2 text-sm placeholder:text-muted focus:border-ink";

  return (
    <div className="index-card mt-8 px-6 pb-6 pt-7">
      <h2 className="font-display text-2xl">{isEdit ? "Edit contact" : "New contact"}</h2>
      <p className="mt-1 text-xs text-muted">
        The bio is what search reads most closely — the richer it is, the better the matches.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted">
          Name *
          <input required value={fields.name} onChange={set("name")} className={`mt-1 ${inputCls}`} placeholder="Sarah Chen" />
        </label>
        <label className="text-xs text-muted">
          Company *
          <input required value={fields.company} onChange={set("company")} className={`mt-1 ${inputCls}`} placeholder="TSMC" />
        </label>
        <label className="text-xs text-muted">
          Title
          <input value={fields.title} onChange={set("title")} className={`mt-1 ${inputCls}`} placeholder="Director of Procurement" />
        </label>
        <label className="text-xs text-muted">
          Email
          <input type="email" value={fields.email} onChange={set("email")} className={`mt-1 ${inputCls}`} placeholder="sarah.chen@example.com" />
        </label>
        <label className="text-xs text-muted sm:col-span-2">
          Expertise
          <input value={fields.expertise} onChange={set("expertise")} className={`mt-1 ${inputCls}`} placeholder="Semiconductor supply chain, vendor negotiations…" />
        </label>
        <label className="text-xs text-muted sm:col-span-2">
          Bio
          <textarea rows={4} value={fields.bio} onChange={set("bio")} className={`mt-1 ${inputCls}`} placeholder="15 years in semiconductor procurement at TSMC…" />
        </label>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={() => onSave(fields)}
          disabled={saving || !fields.name.trim() || !fields.company.trim()}
          className="rounded-sm bg-ink px-4 py-2 text-sm font-medium text-card transition-colors hover:bg-oxblood-deep disabled:opacity-40"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add to rolodex"}
        </button>
        <button onClick={onCancel} className="text-sm text-muted hover:text-ink">
          Cancel
        </button>
      </div>
    </div>
  );
}
