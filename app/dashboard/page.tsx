import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Nav from "@/components/Nav";
import SearchChat from "@/components/SearchChat";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  return (
    <div className="flex min-h-screen">
      <Nav active="search" user={{ name: session.user.name, email: session.user.email }} />
      <main className="flex min-w-0 flex-1 flex-col">
        <SearchChat firstName={session.user.name?.split(" ")[0] ?? "there"} />
      </main>
    </div>
  );
}
