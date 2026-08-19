"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-oxblood"
    >
      Sign out
    </button>
  );
}
