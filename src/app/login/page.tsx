import { LoginForm } from "@/components/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Sign in · SOC Daily" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 pt-4">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-wider text-signal">Analyst access</p>
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted">
          We&apos;ll email you a one-time link. No password to remember. Your streak follows you to any
          device.
        </p>
      </div>
      {isSupabaseConfigured ? (
        <LoginForm />
      ) : (
        <p className="rounded-lg border border-amber/30 bg-amber-dim/40 p-4 font-mono text-sm text-amber">
          Accounts are off in demo mode. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to
          .env.local to turn them on.
        </p>
      )}
    </div>
  );
}
