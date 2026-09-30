"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { getFlagUrl } from "@/lib/country-codes";
import type { QuizCountry, QuizDirection } from "@/lib/quiz-session";
import {
  REVIEW_CHOICE_SLOTS,
  advanceReview,
  createReviewSession,
  moveReviewCursor,
  reviewAdvanceLabel,
  reviewMasteredCount,
  reviewRoundPosition,
  reviewSectionPercents,
  selectFocusedReviewChoice,
  selectReviewChoice,
  type ReviewSession,
} from "@/lib/review-session";
import { cn } from "@/lib/utils";

type ReviewQuizProps = {
  title: string;
  continentName: string;
  countries: QuizCountry[];
  exitHref?: string;
  exitLabel?: string;
};

const sessionCache = new WeakMap<readonly QuizCountry[], ReviewSession>();

function subscribeReviewStore() {
  return () => {};
}

function readCachedReviewSession(countries: readonly QuizCountry[]): ReviewSession | null {
  const cached = sessionCache.get(countries);
  if (cached) return cached;

  const created = createReviewSession(countries);
  if (!created) return null;

  sessionCache.set(countries, created);
  return created;
}

function readServerReviewSession() {
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

export function ReviewQuiz({
  title,
  continentName,
  countries,
  exitHref = "/",
  exitLabel = "Home",
}: ReviewQuizProps) {
  const built = useSyncExternalStore(
    subscribeReviewStore,
    () => readCachedReviewSession(countries),
    readServerReviewSession
  );
  const [override, setOverride] = useState<ReviewSession | null>(null);
  const session = override ?? built;
  const isQuestion = session?.phase === "question";

  const updateSession = useCallback(
    (change: (current: ReviewSession) => ReviewSession) => {
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
          current.phase === "question" ? moveReviewCursor(current, direction) : current
        );
        return;
      }

      if (event.code === "Space") {
        if (event.repeat) return;
        event.preventDefault();
        updateSession((current) =>
          current.phase === "question" ? selectFocusedReviewChoice(current) : current
        );
        return;
      }

      if (event.code === "Enter" || event.code === "NumpadEnter") {
        if (event.repeat) return;
        event.preventDefault();
        updateSession((current) =>
          current.phase === "question" ? advanceReview(current) : current
        );
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isQuestion, updateSession]);

  if (!session) {
    return <ReviewSkeleton title={title} />;
  }

  if (session.phase === "results") {
    return (
      <ReviewResults
        title={title}
        exitHref={exitHref}
        exitLabel={exitLabel}
        firstTryCorrect={session.firstTryCorrect}
        total={session.totalCountries}
        sections={session.groups.length}
        onPlayAgain={() => {
          const next = createReviewSession(countries);
          if (next) setOverride(next);
        }}
      />
    );
  }

  const question = session.queue[session.index];
  if (!question) return <ReviewSkeleton title={title} />;

  const answered = session.selectedAlpha2 !== null;
  const selectedCorrect = session.selectedAlpha2 === question.promptAlpha2;
  const position = reviewRoundPosition(session);
  const isLastGroup = session.groupIndex + 1 === session.groups.length;
  const mastered = reviewMasteredCount(session);
  const sections = reviewSectionPercents(session);
  const cursorIndex = session.cursor;
  const prompt =
    question.kind === "country-to-flag"
      ? `Which flag is this country in ${continentName}?`
      : `Which country is this flag in ${continentName}?`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6" data-quiz-screen="question">
      <div className="flex flex-col gap-2">
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={session.totalCountries}
          aria-valuenow={mastered}
          aria-label="Review progress"
          aria-valuetext={`Section ${session.groupIndex + 1} of ${session.groups.length}, ${session.masteredAlpha2.length} of ${session.groups[session.groupIndex]?.length ?? 0} learned in this section`}
        >
          {sections.map((percent, index) => (
            <div
              key={index}
              className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
              data-section-index={index + 1}
              data-section-fill={Math.round(percent)}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Section {session.groupIndex + 1} of {session.groups.length}
          </p>
          <p data-review-phase={position.retry ? "retry" : "round"}>
            {position.retry
              ? `Missed ${position.current} of ${position.total}`
              : `Question ${position.current} of ${position.total}`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Intuitive flag review</p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        {position.retry && (
          <p className="text-center text-sm font-medium text-amber-700 dark:text-amber-400">
            {isLastGroup
              ? "Answer the ones you missed to finish."
              : "Answer the ones you missed to start the next group."}
          </p>
        )}
        <p className="text-center text-lg font-medium">{prompt}</p>
      </div>

      {question.kind === "flag-to-country" ? (
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
        aria-describedby="review-keys"
      >
        {REVIEW_CHOICE_SLOTS.map((slot, index) => {
          const choice = question.choices[index];
          if (!choice) return null;

          const isCursor = index === cursorIndex;
          const isCorrect = answered && choice.alpha2 === question.promptAlpha2;
          const isWrong =
            answered && session.selectedAlpha2 === choice.alpha2 && !isCorrect;

          return (
            <button
              key={slot.id}
              type="button"
              tabIndex={-1}
              aria-label={
                question.kind === "country-to-flag"
                  ? `${slot.label}. ${choice.name}`
                  : undefined
              }
              data-quiz-choice={slot.label}
              data-cursor={isCursor ? "true" : "false"}
              data-result={isCorrect ? "correct" : isWrong ? "wrong" : "idle"}
              onClick={() => {
                updateSession((current) => selectReviewChoice(current, index));
              }}
              className={cn(
                "flex min-h-28 items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-colors sm:px-4",
                question.kind === "country-to-flag" && "justify-center",
                !answered && "cursor-pointer hover:bg-muted",
                !answered && !isCursor && "border-border bg-card",
                !answered && isCursor && "border-primary bg-primary/5 ring-2 ring-primary",
                isCorrect && "border-emerald-700 bg-emerald-600 text-white",
                isWrong && "border-red-700 bg-red-600 text-white",
                answered &&
                  !isCorrect &&
                  !isWrong &&
                  "border-border bg-card text-muted-foreground",
                answered &&
                  isCursor &&
                  "ring-2 ring-foreground/40 ring-offset-2 ring-offset-background"
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
                {slot.label}
              </span>
              {question.kind === "country-to-flag" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- flagcdn image, country name is in aria-label */}
                  <img
                    src={getFlagUrl(choice.alpha2, 320)}
                    alt=""
                    width={320}
                    height={213}
                    className="h-16 w-auto max-w-[calc(100%-3rem)] rounded border bg-background object-contain shadow-sm sm:h-24"
                  />
                  {isCorrect && <Check className="size-5 shrink-0" aria-hidden="true" />}
                  {isWrong && <X className="size-5 shrink-0" aria-hidden="true" />}
                  {isCorrect && <span className="sr-only">Correct answer</span>}
                  {isWrong && <span className="sr-only">Your answer</span>}
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 text-base leading-snug font-medium wrap-break-word sm:text-lg">
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
            ? "Correct"
            : `Incorrect. The answer is ${question.promptName}.`
          : position.retry
            ? `Missed question ${position.current} of ${position.total}. ${prompt}`
            : `Question ${position.current} of ${position.total}. ${prompt}`}
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          id="review-keys"
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Kbd>Arrows</Kbd> or <Kbd>WASD</Kbd> to move
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Kbd>Space</Kbd> to answer
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Kbd>Enter</Kbd> for next
          </span>
        </p>
        <Button
          type="button"
          size="lg"
          className="h-11 px-5 text-base sm:min-w-36"
          disabled={!answered}
          onClick={() => {
            updateSession((current) => advanceReview(current));
          }}
        >
          {reviewAdvanceLabel(session)}
        </Button>
      </div>
    </div>
  );
}

function ReviewResults({
  title,
  firstTryCorrect,
  total,
  sections,
  exitHref,
  exitLabel,
  onPlayAgain,
}: {
  title: string;
  firstTryCorrect: number;
  total: number;
  sections: number;
  exitHref: string;
  exitLabel: string;
  onPlayAgain: () => void;
}) {
  const percent = total === 0 ? 0 : Math.round((firstTryCorrect / total) * 100);

  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-10 text-center"
      data-quiz-screen="results"
    >
      <div
        className="flex w-full gap-1.5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={sections}
        aria-valuenow={sections}
        aria-label="Review progress"
      >
        {Array.from({ length: sections }, (_, index) => (
          <div
            key={index}
            className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-primary"
          />
        ))}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">Intuitive flag review</p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      <p className="font-heading text-6xl font-bold tracking-tight">{percent}%</p>
      <p className="text-lg text-muted-foreground">
        You knew {firstTryCorrect} of {total} on the first try.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" size="lg" className="h-11 px-5" onClick={onPlayAgain}>
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

function ReviewSkeleton({ title }: { title: string }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6" data-quiz-screen="loading">
      <div className="h-2.5 animate-pulse rounded-full bg-muted" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">Intuitive flag review</p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="h-44 animate-pulse rounded-2xl bg-muted sm:h-60" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {REVIEW_CHOICE_SLOTS.map((slot) => (
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
