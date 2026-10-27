"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-signal/40 bg-signal-dim/30 p-4">
        <p className="font-mono text-sm text-signal">LINK SENT</p>
        <p className="mt-1 text-text">
          Check <span className="font-mono">{email}</span> for your sign-in link.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="email" className="block font-mono text-xs uppercase tracking-wider text-faint">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="analyst@example.com"
        className="w-full rounded-lg border border-line-strong bg-panel px-3 py-2.5 font-mono text-sm text-text placeholder:text-faint focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal/50"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-lg bg-signal px-4 py-2.5 font-mono text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Email me a link"}
      </button>
      {status === "error" && <p className="text-sm text-alert">{error}</p>}
    </form>
  );
}
