import { notFound, redirect } from "next/navigation";

const worldwideModes = ["which-country", "which-flag"] as const;

type WorldwideModePageProps = {
  params: Promise<{ mode: string }>;
};

export default async function WorldwideQuizModeRedirect({
  params,
}: WorldwideModePageProps) {
  const { mode } = await params;

  if (!worldwideModes.includes(mode as (typeof worldwideModes)[number])) {
    notFound();
  }

  redirect(`/quiz/worldwide/${mode}/all`);
}
