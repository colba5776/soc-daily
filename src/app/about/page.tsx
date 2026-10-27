import Link from "next/link";

export const metadata = { title: "About · SOC Daily" };

const steps = [
  ["Read the scenario", "Every day there is one new situation: an email, a slice of logs, or an alert."],
  ["Analyze the artifact", "Look at it the way a SOC analyst would. What is normal, and what is not?"],
  ["Make the call", "Pick one answer. Your first answer is final, just like a real triage decision."],
  ["Learn the technique", "See why, plus the MITRE ATT&CK technique it maps to, then come back tomorrow."],
];

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-wider text-signal">About</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Reps for blue teamers.</h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted">
          SOC Daily is one short security analyst challenge per day. It is built for people studying for
          Security+, CySA+, or their first SOC role, and for working analysts who want a quick daily warm-up.
          Five minutes, one decision, one lesson.
        </p>
      </section>

      <ol className="grid gap-3 sm:grid-cols-2">
        {steps.map(([title, body], i) => (
          <li key={title} className="rounded-lg border border-line bg-panel p-4">
            <p className="font-mono text-xs text-signal">0{i + 1}</p>
            <p className="mt-1 font-semibold text-text">{title}</p>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </li>
        ))}
      </ol>

      <section className="space-y-2 text-[15px] leading-relaxed text-muted">
        <h2 className="text-lg font-semibold text-text">Streaks</h2>
        <p>
          Your streak counts consecutive days played, right or wrong. Showing up every day is the point. New
          challenges unlock at midnight Eastern time.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-text">About the data</h2>
        <p>
          Every log, email, hostname, and IP address is synthetic. IPs come from ranges reserved for
          documentation, and domains use the .example top-level domain. Nothing here is real customer data.
        </p>
        <h2 className="pt-4 text-lg font-semibold text-text">Who built this</h2>
        <p>
          SOC Daily is built by Colton Bayne, CompTIA Security+ certified and working toward a SOC analyst role.
          {/* TODO: replace with your LinkedIn URL */}{" "}
          <a href="https://www.linkedin.com/" className="text-signal underline underline-offset-2">
            Connect on LinkedIn
          </a>
          .
        </p>
      </section>

      <Link
        href="/"
        className="inline-block rounded-lg bg-signal px-5 py-2.5 font-mono text-sm font-semibold text-bg hover:brightness-110"
      >
        Play today&apos;s challenge →
      </Link>
    </div>
  );
}
