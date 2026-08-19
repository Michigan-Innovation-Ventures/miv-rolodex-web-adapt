import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignInButton from "@/components/SignInButton";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm">
        <div className="index-card px-8 pb-8 pt-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            MIV · Internal
          </p>
          <h1 className="mt-3 font-display text-5xl leading-none">Rolodex</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The fund&apos;s network, searchable in plain language. Ask for the person you need —
            get the person to call.
          </p>
          <div className="mt-8">
            <SignInButton />
          </div>
        </div>
        <p className="mt-4 text-center font-mono text-[11px] text-muted">
          Access is limited to fund members.
        </p>
      </div>
    </main>
  );
}
