import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function UserNav() {
  const user = await getCurrentUser();
  const linkClass = "rounded-md px-2.5 py-1.5 text-muted hover:bg-panel-2 hover:text-text";

  if (user) {
    return (
      <Link href="/profile" className={linkClass}>
        Profile
      </Link>
    );
  }

  return (
    <>
      <Link href="/profile" className={linkClass}>
        Stats
      </Link>
      {isSupabaseConfigured && (
        <Link
          href="/login"
          className="ml-1 rounded-md border border-line-strong px-3 py-1.5 text-text hover:border-signal hover:text-signal"
        >
          Sign in
        </Link>
      )}
    </>
  );
}
