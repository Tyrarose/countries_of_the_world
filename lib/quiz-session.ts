export const QUIZ_CHOICE_COUNT = 4;

// Visual order is a 2×2 grid: A C / B D, so arrows and WASD match the keys.
export const QUIZ_CHOICE_SLOTS = [
  { id: "a", label: "A", row: 0, col: 0 },
  { id: "c", label: "C", row: 0, col: 1 },
  { id: "b", label: "B", row: 1, col: 0 },
  { id: "d", label: "D", row: 1, col: 1 },
] as const;

export type QuizCountry = {
  alpha2: string;
  name: string;
};

export type QuizQuestion = {
  promptAlpha2: string;
  promptName: string;
  choices: QuizCountry[];
};

export type QuizCursor = {
  row: 0 | 1;
  col: 0 | 1;
};

export type QuizDirection = "up" | "down" | "left" | "right";

export type QuizAnswer = {
  promptAlpha2: string;
  promptName: string;
  selectedAlpha2: string;
  correct: boolean;
};

export type QuizSession = {
  questions: QuizQuestion[];
  index: number;
  cursor: QuizCursor;
  selectedAlpha2: string | null;
  correctCount: number;
  answers: QuizAnswer[];
  phase: "question" | "results";
};

export type MistakeReview = {
  session: QuizSession;
  knownBank: QuizCountry[];
};

export function createQuizSession(
  countries: readonly QuizCountry[],
  limit?: number
): QuizSession | null {
  const pool =
    limit && limit > 0 && limit < countries.length
      ? shuffle(countries).slice(0, limit)
      : countries;
  const questions = buildQuizQuestions(pool);
  if (questions.length === 0) return null;

  return {
    questions,
    index: 0,
    cursor: { row: 0, col: 0 },
    selectedAlpha2: null,
    correctCount: 0,
    answers: [],
    phase: "question",
  };
}

export function moveQuizCursor(
  session: QuizSession,
  direction: QuizDirection
): QuizSession {
  if (session.phase !== "question") return session;

  const choiceCount = session.questions[session.index]?.choices.length ?? QUIZ_CHOICE_COUNT;
  if (choiceCount <= 2) {
    const col: 0 | 1 = direction === "left" || direction === "up" ? 0 : 1;
    if (session.cursor.row === 0 && session.cursor.col === col) return session;
    return { ...session, cursor: { row: 0, col } };
  }

  const cursor: QuizCursor = { ...session.cursor };
  if (direction === "up") cursor.row = 0;
  if (direction === "down") cursor.row = 1;
  if (direction === "left") cursor.col = 0;
  if (direction === "right") cursor.col = 1;

  if (cursor.row === session.cursor.row && cursor.col === session.cursor.col) {
    return session;
  }

  return { ...session, cursor };
}

export function selectQuizChoice(
  session: QuizSession,
  choiceIndex: number
): QuizSession {
  if (session.phase !== "question" || session.selectedAlpha2) return session;

  const question = session.questions[session.index];
  const choice = question?.choices[choiceIndex];
  const slot = QUIZ_CHOICE_SLOTS[choiceIndex];
  if (!question || !choice || !slot) return session;

  const correct = choice.alpha2 === question.promptAlpha2;

  return {
    ...session,
    cursor: { row: slot.row, col: slot.col },
    selectedAlpha2: choice.alpha2,
    correctCount: session.correctCount + (correct ? 1 : 0),
    answers: [
      ...session.answers,
      {
        promptAlpha2: question.promptAlpha2,
        promptName: question.promptName,
        selectedAlpha2: choice.alpha2,
        correct,
      },
    ],
  };
}

export function selectFocusedQuizChoice(session: QuizSession): QuizSession {
  return selectQuizChoice(session, cursorToChoiceIndex(session.cursor));
}

export function advanceQuiz(session: QuizSession): QuizSession {
  if (session.phase !== "question" || !session.selectedAlpha2) return session;

  if (session.index + 1 >= session.questions.length) {
    return { ...session, phase: "results" };
  }

  return {
    ...session,
    index: session.index + 1,
    cursor: { row: 0, col: 0 },
    selectedAlpha2: null,
  };
}

const REVIEW_KNOWN_MIN = 2;
const REVIEW_KNOWN_MAX = 3;

export function missedQuizCount(session: QuizSession): number {
  return session.answers.filter((answer) => !answer.correct).length;
}

// Rebuild the misses as two-choice questions, with 2–3 already-correct
// countries mixed in so the round is not only the ones they missed.
export function createMistakeReviewSession(
  source: QuizSession,
  pool: readonly QuizCountry[],
  knownBank: readonly QuizCountry[] = []
): MistakeReview | null {
  if (source.phase !== "results" || source.answers.length === 0) return null;

  const missedIds = new Set<string>();
  const correct: QuizCountry[] = [];

  source.questions.forEach((question, index) => {
    const answer = source.answers[index];
    if (!answer) return;
    if (answer.correct) {
      correct.push({
        alpha2: question.promptAlpha2,
        name: question.promptName,
      });
      return;
    }
    missedIds.add(question.promptAlpha2);
  });

  if (missedIds.size === 0) return null;

  const bank = new Map<string, QuizCountry>();
  for (const country of knownBank) {
    if (!missedIds.has(country.alpha2)) bank.set(country.alpha2, country);
  }
  for (const country of correct) {
    if (!missedIds.has(country.alpha2)) bank.set(country.alpha2, country);
  }

  const knownBankNext = [...bank.values()];
  const fillers = shuffle(knownBankNext).slice(0, knownMixCount(knownBankNext.length));
  const questions: QuizQuestion[] = [];

  source.questions.forEach((question, index) => {
    const answer = source.answers[index];
    if (!answer || answer.correct) return;

    const country = {
      alpha2: question.promptAlpha2,
      name: question.promptName,
    };
    const picked =
      question.choices.find((choice) => choice.alpha2 === answer.selectedAlpha2) ??
      pool.find((item) => item.alpha2 === answer.selectedAlpha2);
    const other = otherCountry(country, pool, picked);
    if (!other) return;
    questions.push(pairQuestion(country, other));
  });

  for (const country of fillers) {
    const previous = source.questions.find(
      (question) => question.promptAlpha2 === country.alpha2
    );
    const distractors =
      previous?.choices.filter((choice) => choice.alpha2 !== country.alpha2) ?? [];
    const other = otherCountry(country, pool, shuffle(distractors)[0]);
    if (!other) continue;
    questions.push(pairQuestion(country, other));
  }

  if (questions.length === 0) return null;

  return {
    knownBank: knownBankNext,
    session: {
      questions: shuffle(questions),
      index: 0,
      cursor: { row: 0, col: 0 },
      selectedAlpha2: null,
      correctCount: 0,
      answers: [],
      phase: "question",
    },
  };
}

function knownMixCount(available: number): number {
  if (available <= 1) return available;
  const target = Math.random() < 0.5 ? REVIEW_KNOWN_MIN : REVIEW_KNOWN_MAX;
  return Math.min(available, target);
}

function pairQuestion(country: QuizCountry, other: QuizCountry): QuizQuestion {
  return {
    promptAlpha2: country.alpha2,
    promptName: country.name,
    choices: shuffle([
      { alpha2: country.alpha2, name: country.name },
      { alpha2: other.alpha2, name: other.name },
    ]),
  };
}

function otherCountry(
  country: QuizCountry,
  pool: readonly QuizCountry[],
  preferred?: QuizCountry
): QuizCountry | null {
  if (preferred && preferred.alpha2 !== country.alpha2) return preferred;
  const candidates = pool.filter((item) => item.alpha2 !== country.alpha2);
  return shuffle(candidates)[0] ?? null;
}

export function cursorToChoiceIndex(cursor: QuizCursor): number {
  return QUIZ_CHOICE_SLOTS.findIndex(
    (slot) => slot.row === cursor.row && slot.col === cursor.col
  );
}

function buildQuizQuestions(countries: readonly QuizCountry[]): QuizQuestion[] {
  if (countries.length < QUIZ_CHOICE_COUNT) return [];

  return shuffle(countries).map((country) => {
    const distractors = shuffle(
      countries.filter((candidate) => candidate.alpha2 !== country.alpha2)
    ).slice(0, QUIZ_CHOICE_COUNT - 1);

    return {
      promptAlpha2: country.alpha2,
      promptName: country.name,
      choices: shuffle([country, ...distractors]),
    };
  });
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
