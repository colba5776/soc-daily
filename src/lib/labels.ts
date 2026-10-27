import type { Category } from "./types";

export const CATEGORY_LABELS: Record<Category, string> = {
  phishing: "Phishing",
  windows_logs: "Windows Logs",
  network: "Network",
  cloud: "Cloud / Identity",
  web: "Web App",
  linux: "Linux",
  malware: "Malware",
};

export const DIFFICULTY_LABELS = ["", "Tier 1", "Tier 2", "Tier 3"] as const;

/** T1566.002 -> https://attack.mitre.org/techniques/T1566/002/ */
export function attackUrl(technique: string): string {
  const [base, sub] = technique.split(".");
  return `https://attack.mitre.org/techniques/${base}/${sub ? `${sub}/` : ""}`;
}
