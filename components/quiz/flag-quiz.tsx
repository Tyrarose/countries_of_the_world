"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { getFlagUrl } from "@/lib/country-codes";
import { cn } from "@/lib/utils";
import {
  QUIZ_CHOICE_SLOTS,
  advanceQuiz,
  createMistakeReviewSession,
  createQuizSession,
  cursorToChoiceIndex,
  missedQuizCount,
  moveQuizCursor,
  selectFocusedQuizChoice,
  selectQuizChoice,
  type QuizCountry,
  type QuizDirection,
  type QuizSession,
} from "@/lib/quiz-session";

export type FlagQuizMode = "flag-to-country" | "country-to-flag";

type FlagQuizProps = {
  title: string;
  countries: QuizCountry[];
  mode?: FlagQuizMode;
  prompt?: string;
  countryLimit?: number;
  exitHref?: string;
  exitLabel?: string;
};

type MistakeReviewState = {
  round: number;
  pool: QuizCountry[];
  knownBank: QuizCountry[];
};

const sessionCache = new WeakMap<readonly QuizCountry[], Map<number, QuizSession>>();

function subscribeQuizStore() {
  return () => {};
}

function readCachedQuizSession(
  countries: readonly QuizCountry[],
  countryLimit: number
): QuizSession | null {
  let byLimit = sessionCache.get(countries);
  if (!byLimit) {
    byLimit = new Map();
    sessionCache.set(countries, byLimit);
  }

  const cached = byLimit.get(countryLimit);
  if (cached) return cached;

  const created = createQuizSession(countries, countryLimit || undefined);
  if (!created) return null;

  byLimit.set(countryLimit, created);
  return created;
}

function readServerQuizSession() {
  return null;
}

const DIRECTION_KEYS: Record<string, QuizDirection> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

export function FlagQuiz({
  title,
  countries,
  mode = "flag-to-country",
  prompt,
  countryLimit,
  exitHref = "/",
  exitLabel = "Home",
}: FlagQuizProps) {
  const questionCount = countryLimit && countryLimit > 0 ? countryLimit : 0;
  const questionPrompt =
    prompt ??
    (mode === "country-to-flag"
      ? "Which flag is this country?"
      : "Which country is this flag?");
  const built = useSyncExternalStore(
    subscribeQuizStore,
    () => readCachedQuizSession(countries, questionCount),
    readServerQuizSession
  );
  const [override, setOverride] = useState<QuizSession | null>(null);
  const [mistakeReview, setMistakeReview] = useState<MistakeReviewState | null>(null);
  const session = override ?? built;
  const reviewRound = mistakeReview?.round ?? 0;
  const isQuestion = session?.phase === "question";
  const revealed =
    session?.phase === "question" && session.selectedAlpha2 !== null;

  const updateSession = useCallback(
    (change: (current: QuizSession) => QuizSession) => {
      setOverride((prev) => {
        const current = prev ?? built;
        if (!current) return prev;
        return change(current);
      });
    },
    [built]
  );

  useEffect(() => {
    if (!isQuestion) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) {
        return;
      }
      if (isTypingTarget(event.target)) return;

      const direction = DIRECTION_KEYS[event.code];
      if (direction) {
        event.preventDefault();
        updateSession((current) =>
          current.phase === "question" ? moveQuizCursor(current, direction) : current
        );
        return;
      }

      if (event.code === "Space") {
        if (event.repeat) return;
        event.preventDefault();
        updateSession((current) =>
          current.phase === "question" ? selectFocusedQuizChoice(current) : current
        );
        return;
      }

      if (event.code === "Enter" || event.code === "NumpadEnter") {
        if (event.repeat) return;
        event.preventDefault();
        updateSession((current) =>
          current.phase === "question" ? advanceQuiz(current) : current
        );
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isQuestion, updateSession]);

  useEffect(() => {
    if (!revealed) return;

    const readyAt = performance.now() + 300;

    function onClick(event: MouseEvent) {
      if (event.button !== 0) return;
      if (performance.now() < readyAt) return;
      updateSession((current) => advanceQuiz(current));
    }

    document.documentElement.classList.add("cursor-pointer");
    window.addEventListener("click", onClick);
    return () => {
      document.documentElement.classList.remove("cursor-pointer");
      window.removeEventListener("click", onClick);
    };
  }, [revealed, updateSession]);

  if (!session) {
    return <QuizSkeleton title={title} />;
  }

  function playAgain() {
    const next = createQuizSession(countries, questionCount || undefined);
    if (!next) return;
    setMistakeReview(null);
    setOverride(next);
  }

  function startMistakeReview() {
    if (!session || session.phase !== "results") return;

    const pool =
      mistakeReview?.pool ??
      session.questions.map((question) => ({
        alpha2: question.promptAlpha2,
        name: question.promptName,
      }));
    const next = createMistakeReviewSession(
      session,
      pool,
      mistakeReview?.knownBank ?? []
    );
    if (!next) return;

    setMistakeReview({
      round: reviewRound + 1,
      pool,
      knownBank: next.knownBank,
    });
    setOverride(next.session);
  }

  if (session.phase === "results") {
    const missed = missedQuizCount(session);
    const cleared = reviewRound > 0 && missed === 0;

    return (
      <QuizResults
        title={title}
        mode={mode}
        exitHref={exitHref}
        exitLabel={exitLabel}
        correctCount={session.correctCount}
        total={session.questions.length}
        reviewRound={reviewRound}
        missed={missed}
        cleared={cleared}
        onPlayAgain={playAgain}
        onReviewMistakes={missed > 0 ? startMistakeReview : undefined}
      />
    );
  }

  const question = session.questions[session.index];
  if (!question) return <QuizSkeleton title={title} />;

  const answered = session.selectedAlpha2 !== null;
  const selectedCorrect = session.selectedAlpha2 === question.promptAlpha2;
  const isLast = session.index + 1 === session.questions.length;
  const progress =
    ((session.index + (answered ? 1 : 0)) / session.questions.length) * 100;
  const cursorIndex = cursorToChoiceIndex(session.cursor);

  const eyebrow = reviewEyebrow(reviewRound);
  const choiceCount = question.choices.length;

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-6"
      data-quiz-screen="question"
      data-quiz-stage={reviewRound > 0 ? "review" : "quiz"}
      data-quiz-round={reviewRound}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {title}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {session.index + 1} / {session.questions.length}
          <span aria-hidden="true"> · </span>
          <span>
            {session.correctCount} correct
          </span>
        </p>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={session.questions.length}
        aria-valuenow={session.index + (answered ? 1 : 0)}
        aria-label="Quiz progress"
      >
        <div
          className="h-full bg-primary transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-center text-lg font-medium">{questionPrompt}</p>

      {mode === "flag-to-country" ? (
        <div className="mx-auto flex h-44 w-full max-w-xl items-center justify-center rounded-2xl border bg-muted p-5 shadow-sm sm:h-60">
          {/* eslint-disable-next-line @next/next/no-img-element -- flagcdn image, country code stays out of the alt text */}
          <img
            src={getFlagUrl(question.promptAlpha2, 640)}
            alt=""
            width={640}
            height={427}
            className="max-h-full w-auto max-w-full rounded-md border bg-background object-contain shadow-md"
          />
        </div>
      ) : (
        <div className="mx-auto flex h-44 w-full max-w-xl items-center justify-center rounded-2xl border bg-muted px-6 shadow-sm sm:h-60">
          <p className="text-center font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {question.promptName}
          </p>
        </div>
      )}

      <div
        className="grid grid-cols-2 gap-3 sm:gap-4"
        role="group"
        aria-label="Answer choices"
        aria-describedby="quiz-keys"
        data-choice-count={choiceCount}
      >
        {question.choices.map((choice, index) => {
          const slot = QUIZ_CHOICE_SLOTS[index];
          if (!slot) return null;

          const label = choiceCount === 2 ? (index === 0 ? "A" : "B") : slot.label;
          const isCursor = index === cursorIndex;
          const isCorrect = answered && choice.alpha2 === question.promptAlpha2;
          const isWrong =
            answered &&
            session.selectedAlpha2 === choice.alpha2 &&
            !isCorrect;

          return (
            <button
              key={slot.id}
              type="button"
              tabIndex={-1}
              aria-label={
                mode === "country-to-flag"
                  ? `${label}. ${choice.name}`
                  : undefined
              }
              data-quiz-choice={label}
              data-cursor={isCursor ? "true" : "false"}
              data-result={isCorrect ? "correct" : isWrong ? "wrong" : "idle"}
              onClick={() => {
                updateSession((current) => selectQuizChoice(current, index));
              }}
              className={cn(
                "flex min-h-20 items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-colors sm:px-4",
                mode === "country-to-flag" && "justify-center",
                !answered && "cursor-pointer hover:bg-muted",
                !answered &&
                  !isCursor &&
                  "border-border bg-card",
                !answered &&
                  isCursor &&
                  "border-primary bg-primary/5 ring-2 ring-primary",
                isCorrect && "border-emerald-700 bg-emerald-600 text-white",
                isWrong && "border-red-700 bg-red-600 text-white",
                answered &&
                  !isCorrect &&
                  !isWrong &&
                  "border-border bg-card text-muted-foreground",
                answered && isCursor && "ring-2 ring-foreground/40 ring-offset-2 ring-offset-background"
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
                  isCorrect || isWrong
                    ? "bg-white/20 text-white"
                    : isCursor && !answered
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                )}
                aria-hidden="true"
              >
                {label}
              </span>
              {mode === "country-to-flag" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- flagcdn image, country name is in aria-label */}
                  <img
                    src={getFlagUrl(choice.alpha2, 320)}
                    alt=""
                    width={320}
                    height={213}
                    className="h-12 w-auto max-w-[calc(100%-3rem)] rounded border bg-background object-contain shadow-sm sm:h-14"
                  />
                  {isCorrect && <Check className="size-5 shrink-0" aria-hidden="true" />}
                  {isWrong && <X className="size-5 shrink-0" aria-hidden="true" />}
                  {isCorrect && <span className="sr-only">Correct answer</span>}
                  {isWrong && <span className="sr-only">Your answer</span>}
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 text-sm leading-snug font-medium wrap-break-word sm:text-base">
                    {choice.name}
                  </span>
                  {isCorrect && <Check className="size-5 shrink-0" aria-hidden="true" />}
                  {isWrong && <X className="size-5 shrink-0" aria-hidden="true" />}
                  {isCorrect && <span className="sr-only">Correct answer</span>}
                  {isWrong && <span className="sr-only">Your answer</span>}
                </>
              )}
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {answered
          ? selectedCorrect
            ? `Correct. ${isLast ? "Click anywhere to see results." : "Click anywhere to continue."}`
            : `Incorrect. The answer is ${question.promptName}. ${isLast ? "Click anywhere to see results." : "Click anywhere to continue."}`
          : `Question ${session.index + 1} of ${session.questions.length}`}
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          id="quiz-keys"
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Kbd>Arrows</Kbd> or <Kbd>WASD</Kbd> to move
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Kbd>Space</Kbd> to answer
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Kbd>Enter</Kbd> to continue
          </span>
        </p>
        {answered ? (
          <p className="text-sm font-medium sm:text-right">
            {isLast ? "Click anywhere to see results" : "Click anywhere to continue"}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function QuizResults({
  title,
  mode,
  correctCount,
  total,
  exitHref,
  exitLabel,
  reviewRound,
  missed,
  cleared,
  onPlayAgain,
  onReviewMistakes,
}: {
  title: string;
  mode: FlagQuizMode;
  correctCount: number;
  total: number;
  exitHref: string;
  exitLabel: string;
  reviewRound: number;
  missed: number;
  cleared: boolean;
  onPlayAgain: () => void;
  onReviewMistakes?: () => void;
}) {
  const percent = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  const eyebrow = cleared ? "Review mistakes" : reviewEyebrow(reviewRound);
  const summary = cleared
    ? "You cleared every mistake."
    : reviewRound > 0
      ? `You got ${correctCount} of ${total} this round.`
      : mode === "country-to-flag"
        ? `You matched ${correctCount} of ${total} flags.`
        : `You identified ${correctCount} of ${total} countries.`;
  const detail = cleared
    ? undefined
    : reviewRound > 0
      ? "Keep reviewing until this round is 100%."
      : missed > 0
        ? "Review the ones you missed, with two choices and a few you got right mixed in."
        : undefined;

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-10 text-center"
      data-quiz-screen={cleared ? "cleared" : "results"}
      data-quiz-stage={cleared ? "cleared" : reviewRound > 0 ? "review" : "quiz"}
      data-quiz-round={reviewRound}
    >
      <div>
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {title}
        </h1>
      </div>
      <p className="font-heading text-6xl font-bold tracking-tight">{percent}%</p>
      <div className="flex flex-col gap-2">
        <p className="text-lg text-muted-foreground">{summary}</p>
        {detail ? <p className="text-sm text-muted-foreground">{detail}</p> : null}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onReviewMistakes ? (
          <Button
            type="button"
            size="lg"
            className="h-11 px-5"
            data-quiz-action="review-mistakes"
            onClick={onReviewMistakes}
          >
            {reviewRound === 0 ? "Review mistakes" : "Review mistakes again"}
          </Button>
        ) : null}
        <Button
          type="button"
          size="lg"
          variant={onReviewMistakes ? "outline" : "default"}
          className="h-11 px-5"
          onClick={onPlayAgain}
        >
          Play again
        </Button>
        <Link
          href={exitHref}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5")}
        >
          {exitLabel}
        </Link>
      </div>
    </div>
  );
}

function reviewEyebrow(round: number): string {
  if (round <= 0) return "Flag quiz";
  if (round === 1) return "Review mistakes";
  return "Review mistakes again";
}

function QuizSkeleton({ title }: { title: string }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6" data-quiz-screen="loading">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Flag quiz</p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="h-44 animate-pulse rounded-2xl bg-muted sm:h-60" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {QUIZ_CHOICE_SLOTS.map((slot) => (
          <div key={slot.id} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border bg-muted px-1.5 py-0.5 font-sans text-xs font-medium text-foreground">
      {children}
    </kbd>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}
