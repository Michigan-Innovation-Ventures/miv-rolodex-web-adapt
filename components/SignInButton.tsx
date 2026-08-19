"use client";

import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="inline-flex w-full items-center justify-center gap-2.5 rounded-sm bg-ink px-5 py-3 text-sm font-medium text-card transition-colors hover:bg-oxblood-deep"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M21.35 11.1H12v2.9h5.35c-.5 2.5-2.6 3.9-5.35 3.9a5.9 5.9 0 1 1 0-11.8c1.5 0 2.85.55 3.9 1.45l2.15-2.15A8.9 8.9 0 1 0 12 20.9c4.45 0 8.55-3.2 8.55-8.9 0-.3-.08-.6-.2-.9Z" />
      </svg>
      Sign in with Google
    </button>
  );
}
