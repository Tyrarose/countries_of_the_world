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

export type QuizSession = {
  questions: QuizQuestion[];
  index: number;
  cursor: QuizCursor;
  selectedAlpha2: string | null;
  correctCount: number;
  phase: "question" | "results";
};

export function createQuizSession(
  countries: readonly QuizCountry[]
): QuizSession | null {
  const questions = buildQuizQuestions(countries);
  if (questions.length === 0) return null;

  return {
    questions,
    index: 0,
    cursor: { row: 0, col: 0 },
    selectedAlpha2: null,
    correctCount: 0,
    phase: "question",
  };
}

export function moveQuizCursor(
  session: QuizSession,
  direction: QuizDirection
): QuizSession {
  if (session.phase !== "question") return session;

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
