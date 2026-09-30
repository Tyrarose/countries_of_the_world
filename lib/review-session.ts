import type { QuizCountry, QuizDirection } from "@/lib/quiz-session";

export const REVIEW_GROUP_SIZE = 7;
export const REVIEW_CHOICE_COUNT = 2;

export const REVIEW_CHOICE_SLOTS = [
  { id: "a", label: "A" },
  { id: "b", label: "B" },
] as const;

export type ReviewCursor = 0 | 1;

export type ReviewQuestionKind = "flag-to-country" | "country-to-flag";

export type ReviewQuestion = {
  id: string;
  promptAlpha2: string;
  promptName: string;
  kind: ReviewQuestionKind;
  choices: QuizCountry[];
  retry: boolean;
};

export type ReviewSession = {
  pool: QuizCountry[];
  groups: QuizCountry[][];
  groupIndex: number;
  queue: ReviewQuestion[];
  index: number;
  nextId: number;
  cursor: ReviewCursor;
  selectedAlpha2: string | null;
  masteredAlpha2: string[];
  firstTryCorrect: number;
  totalCountries: number;
  phase: "question" | "results";
};

export function createReviewSession(
  countries: readonly QuizCountry[]
): ReviewSession | null {
  if (countries.length < REVIEW_CHOICE_COUNT) return null;

  const pool = [...countries];
  const groups = chunk(shuffle(pool), REVIEW_GROUP_SIZE);
  const first = groups[0];
  if (!first) return null;

  const round = buildRound(first, pool, 0);

  return {
    pool,
    groups,
    groupIndex: 0,
    queue: round.queue,
    index: 0,
    nextId: round.nextId,
    cursor: 0,
    selectedAlpha2: null,
    masteredAlpha2: [],
    firstTryCorrect: 0,
    totalCountries: pool.length,
    phase: "question",
  };
}

export function moveReviewCursor(
  session: ReviewSession,
  direction: QuizDirection
): ReviewSession {
  if (session.phase !== "question") return session;

  const cursor: ReviewCursor =
    direction === "left" || direction === "up" ? 0 : 1;
  if (cursor === session.cursor) return session;

  return { ...session, cursor };
}

export function selectReviewChoice(
  session: ReviewSession,
  choiceIndex: number
): ReviewSession {
  if (session.phase !== "question" || session.selectedAlpha2) return session;

  const question = session.queue[session.index];
  const choice = question?.choices[choiceIndex];
  if (!question || !choice || (choiceIndex !== 0 && choiceIndex !== 1)) return session;

  const correct = choice.alpha2 === question.promptAlpha2;
  const alreadyMastered = session.masteredAlpha2.includes(question.promptAlpha2);

  return {
    ...session,
    cursor: choiceIndex,
    selectedAlpha2: choice.alpha2,
    masteredAlpha2:
      correct && !alreadyMastered
        ? [...session.masteredAlpha2, question.promptAlpha2]
        : session.masteredAlpha2,
    firstTryCorrect:
      session.firstTryCorrect + (correct && !question.retry ? 1 : 0),
  };
}

export function selectFocusedReviewChoice(session: ReviewSession): ReviewSession {
  return selectReviewChoice(session, session.cursor);
}

export function advanceReview(session: ReviewSession): ReviewSession {
  if (session.phase !== "question" || !session.selectedAlpha2) return session;

  const question = session.queue[session.index];
  const group = session.groups[session.groupIndex];
  if (!question || !group) return session;

  let queue = session.queue;
  let nextId = session.nextId;
  const correct = session.selectedAlpha2 === question.promptAlpha2;

  if (!correct) {
    const country = group.find((item) => item.alpha2 === question.promptAlpha2);
    if (country) {
      const made = makeQuestion(
        country,
        randomKind(),
        group,
        session.pool,
        true,
        nextId
      );
      queue = [...queue, made.question];
      nextId = made.nextId;
    }
  }

  if (session.index + 1 < queue.length) {
    return {
      ...session,
      queue,
      nextId,
      index: session.index + 1,
      cursor: 0,
      selectedAlpha2: null,
    };
  }

  const nextGroupIndex = session.groupIndex + 1;
  const nextGroup = session.groups[nextGroupIndex];
  if (!nextGroup) {
    return {
      ...session,
      queue,
      nextId,
      phase: "results",
    };
  }

  const round = buildRound(nextGroup, session.pool, nextId);

  return {
    ...session,
    queue: round.queue,
    nextId: round.nextId,
    groupIndex: nextGroupIndex,
    index: 0,
    cursor: 0,
    selectedAlpha2: null,
    masteredAlpha2: [],
  };
}

export function reviewAdvanceLabel(
  session: ReviewSession
): "Next" | "Next group" | "See results" {
  if (session.phase !== "question" || !session.selectedAlpha2) return "Next";

  const question = session.queue[session.index];
  if (!question) return "Next";

  const correct = session.selectedAlpha2 === question.promptAlpha2;
  const atEnd = session.index + 1 >= session.queue.length;
  if (!atEnd || !correct) return "Next";
  if (session.groupIndex + 1 >= session.groups.length) return "See results";
  return "Next group";
}

export function reviewRoundPosition(session: ReviewSession): {
  retry: boolean;
  current: number;
  total: number;
} {
  const groupSize = session.groups[session.groupIndex]?.length ?? 0;
  if (session.index < groupSize) {
    return { retry: false, current: session.index + 1, total: groupSize };
  }

  return {
    retry: true,
    current: session.index - groupSize + 1,
    total: Math.max(session.queue.length - groupSize, 1),
  };
}

export function reviewSectionPercents(session: ReviewSession): number[] {
  return session.groups.map((group, index) => {
    if (session.phase === "results" || index < session.groupIndex) return 100;
    if (index > session.groupIndex || group.length === 0) return 0;
    return (session.masteredAlpha2.length / group.length) * 100;
  });
}

export function reviewMasteredCount(session: ReviewSession): number {
  if (session.phase === "results") return session.totalCountries;

  const previous = session.groups
    .slice(0, session.groupIndex)
    .reduce((sum, group) => sum + group.length, 0);

  return previous + session.masteredAlpha2.length;
}

function buildRound(
  group: readonly QuizCountry[],
  pool: readonly QuizCountry[],
  nextId: number
): { queue: ReviewQuestion[]; nextId: number } {
  const kinds = mixedKinds(group.length);
  const queue: ReviewQuestion[] = [];
  let id = nextId;

  shuffle(group).forEach((country, index) => {
    const made = makeQuestion(country, kinds[index] ?? randomKind(), group, pool, false, id);
    queue.push(made.question);
    id = made.nextId;
  });

  return { queue, nextId: id };
}

function makeQuestion(
  country: QuizCountry,
  kind: ReviewQuestionKind,
  group: readonly QuizCountry[],
  pool: readonly QuizCountry[],
  retry: boolean,
  nextId: number
): { question: ReviewQuestion; nextId: number } {
  return {
    question: {
      id: `${country.alpha2}-${nextId}`,
      promptAlpha2: country.alpha2,
      promptName: country.name,
      kind,
      choices: buildChoices(country, group, pool),
      retry,
    },
    nextId: nextId + 1,
  };
}

function buildChoices(
  country: QuizCountry,
  group: readonly QuizCountry[],
  pool: readonly QuizCountry[]
): QuizCountry[] {
  const needed = REVIEW_CHOICE_COUNT - 1;
  const distractors = shuffle(
    group.filter((candidate) => candidate.alpha2 !== country.alpha2)
  ).slice(0, needed);

  if (distractors.length < needed) {
    const used = new Set([country.alpha2, ...distractors.map((item) => item.alpha2)]);
    const extra = shuffle(pool.filter((candidate) => !used.has(candidate.alpha2))).slice(
      0,
      needed - distractors.length
    );
    distractors.push(...extra);
  }

  return shuffle([country, ...distractors]);
}

function mixedKinds(count: number): ReviewQuestionKind[] {
  const kinds = Array.from({ length: count }, () => randomKind());
  if (count > 1 && kinds.every((kind) => kind === kinds[0])) {
    kinds[0] = kinds[0] === "flag-to-country" ? "country-to-flag" : "flag-to-country";
  }
  return kinds;
}

function randomKind(): ReviewQuestionKind {
  return Math.random() < 0.5 ? "flag-to-country" : "country-to-flag";
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

function shuffle<T>(items: readonly T[]): T[] {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex] as T;
    next[swapIndex] = current as T;
  }

  return next;
}
