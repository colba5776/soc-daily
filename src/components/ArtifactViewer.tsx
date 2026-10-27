import type { ArtifactType } from "@/lib/types";

const LABELS: Record<ArtifactType, string> = {
  email: "email.eml",
  log: "events.log",
  alert: "alert.json",
};

// Light highlighting: IPv4 addresses and defanged URLs stand out.
const TOKEN = /(\b\d{1,3}(?:\.\d{1,3}){3}(?:\/\d{1,2})?\b|hxxps?:\/\/\S+)/g;

function highlight(line: string) {
  const parts = line.split(TOKEN);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className={part.startsWith("hxxp") ? "text-amber" : "text-info"}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function ArtifactViewer({ artifact, type }: { artifact: string; type: ArtifactType }) {
  const lines = artifact.split("\n");
  return (
    <figure className="overflow-hidden rounded-lg border border-line bg-[#070a0e] shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_12px_40px_-20px_rgba(0,0,0,0.8)]">
      <figcaption className="flex items-center justify-between border-b border-line bg-panel px-3 py-2">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        </div>
        <span className="font-mono text-[11px] text-faint">{LABELS[type]}</span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-faint">{type}</span>
      </figcaption>
      <div className="artifact-scroll overflow-x-auto">
        <pre className="min-w-max py-3 font-mono text-[12.5px] leading-6 text-[#c9d4df]">
          {lines.map((line, i) => (
            <div key={i} className="flex hover:bg-white/[0.025]">
              <span className="w-10 shrink-0 select-none pr-3 text-right text-faint/60">{i + 1}</span>
              <code className="pr-4">{line ? highlight(line) : " "}</code>
            </div>
          ))}
        </pre>
      </div>
    </figure>
  );
}
