import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth";
import { v5 as uuidv5 } from "uuid";

/**
 * The Supabase contacts table declares user_id as UUID, but Google gives us an
 * email/OAuth id. We derive a stable UUIDv5 from the email so the same person
 * always maps to the same user_id — no schema change, no extra users table.
 */
const USER_NAMESPACE = uuidv5("rolodex.miv", uuidv5.DNS);

export function userIdFromEmail(email: string): string {
  return uuidv5(email.toLowerCase(), USER_NAMESPACE);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  callbacks: {
    jwt({ token }) {
      if (token.email) token.userId = userIdFromEmail(token.email);
      return token;
    },
    session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.userId as string;
      return session;
    },
  },
};

/** Returns the scoped user_id for the current request, or null if signed out. */
export async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  return id ?? null;
}
