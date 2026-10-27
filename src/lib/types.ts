export type Category =
  | "phishing"
  | "windows_logs"
  | "network"
  | "cloud"
  | "web"
  | "linux"
  | "malware";

export type ArtifactType = "email" | "log" | "alert";

/** What the browser is allowed to see. Never includes the answer. */
export interface PublicChallenge {
  id: string;
  number: number;
  publishDate: string;
  title: string;
  category: Category;
  difficulty: 1 | 2 | 3;
  scenario: string;
  artifact: string;
  artifactType: ArtifactType;
  question: string;
  choices: string[];
}

/** Server-only answer data. */
export interface ChallengeAnswer {
  correctIndex: number;
  explanation: string;
  attackTechnique: string | null;
}

export interface AnswerResult {
  challengeId: string;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
  attackTechnique: string | null;
  /** Only set for signed-in users; guests track streaks in the browser. */
  streak?: { current: number; longest: number };
}

export type SubmitResponse =
  | { ok: true; result: AnswerResult }
  | { ok: false; error: string };
