import { SignOutButton } from "@/components/auth/SignOutButton";
import { HomePanel } from "@/components/HomePanel";

const panels = [
  {
    href: "/itinerary",
    title: "Gateways Route",
    description: "Your timestamped itinerary of speakers, workshops, and networking sessions.",
  },
  {
    href: "/delegates",
    title: "Delegate Matching",
    description: "Meet 3 professional delegates matched to your interests and major.",
  },
  {
    href: "/jobs",
    title: "Job Recommendations",
    description: "3 roles from the UBCMA job portal picked for you.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-[max(env(safe-area-inset-top),1.5rem)]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">UBCMA presents</p>
          <h1 className="text-2xl font-bold tracking-tight">Gateways 2026</h1>
        </div>
        <SignOutButton />
      </header>

      <nav className="flex flex-1 flex-col gap-4">
        {panels.map((panel) => (
          <HomePanel key={panel.href} {...panel} />
        ))}
      </nav>
    </main>
  );
}
