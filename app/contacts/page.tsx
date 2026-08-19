import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Nav from "@/components/Nav";
import ContactManager from "@/components/ContactManager";

export default async function ContactsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  return (
    <div className="flex min-h-screen">
      <Nav active="contacts" user={{ name: session.user.name, email: session.user.email }} />
      <main className="min-w-0 flex-1">
        <ContactManager />
      </main>
    </div>
  );
}
