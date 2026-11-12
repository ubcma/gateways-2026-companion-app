import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { JobCard } from "@/components/JobCard";
import { ListSkeleton } from "@/components/ListSkeleton";
import { getJobs } from "@/lib/data/jobs";
import { getProfile } from "@/lib/data/profile";
import { rankMatches } from "@/lib/matching";

export const metadata: Metadata = { title: "Job Recommendations" };

async function JobRecommendations() {
  const [profile, jobs] = await Promise.all([getProfile(), getJobs()]);
  const matches = rankMatches(profile, jobs);

  return (
    <ul className="space-y-3">
      {matches.map((match) => (
        <JobCard key={match.item.id} match={match} major={profile.major} />
      ))}
    </ul>
  );
}

export default function JobsPage() {
  return (
    <>
      <AppHeader
        title="Job Recommendations"
        subtitle="From the UBCMA job portal, based on your profile."
        backHref="/"
      />
      <main className="flex-1 p-4">
        <Suspense fallback={<ListSkeleton />}>
          <JobRecommendations />
        </Suspense>
      </main>
    </>
  );
}
