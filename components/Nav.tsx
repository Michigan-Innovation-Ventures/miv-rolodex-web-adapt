import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

interface NavProps {
  active: "search" | "contacts";
  user: { name?: string | null; email?: string | null };
}

const items = [
  { key: "search", href: "/dashboard", label: "Search" },
  { key: "contacts", href: "/contacts", label: "Contacts" },
] as const;

export default function Nav({ active, user }: NavProps) {
  return (
    <aside className="sticky top-0 flex h-screen w-52 shrink-0 flex-col border-r border-line bg-paper px-6 py-8 max-md:w-16 max-md:px-3">
      <Link href="/dashboard" className="font-display text-3xl leading-none">
        R<span className="text-oxblood">.</span>
      </Link>

      <nav className="mt-10 flex flex-col gap-1">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.key === active ? "page" : undefined}
            className={`rounded-sm px-2 py-1.5 text-sm transition-colors max-md:px-0 max-md:text-center ${
              item.key === active
                ? "bg-card font-medium text-oxblood shadow-card"
                : "text-muted hover:text-ink"
            }`}
          >
            <span className="max-md:hidden">{item.label}</span>
            <span className="md:hidden">{item.label[0]}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-line pt-4 max-md:hidden">
        <p className="truncate text-sm font-medium">{user.name ?? "Member"}</p>
        <p className="truncate font-mono text-[11px] text-muted">{user.email}</p>
        <div className="mt-3">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
