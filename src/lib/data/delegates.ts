import type { Delegate } from "@/lib/types";

export const delegates: Delegate[] = [
  {
    id: "d1",
    name: "Jordan Lee",
    title: "Brand Manager",
    company: "Company A",
    majors: ["Commerce", "Communications"],
    interests: ["Brand Strategy", "Consumer Insights"],
  },
  {
    id: "d2",
    name: "Priya Shah",
    title: "Growth Marketing Lead",
    company: "Company B",
    majors: ["Commerce", "Economics"],
    interests: ["Digital Marketing", "Analytics"],
  },
  {
    id: "d3",
    name: "Marcus Chen",
    title: "Marketing Analyst",
    company: "Company C",
    majors: ["Statistics", "Computer Science"],
    interests: ["Analytics", "Product Marketing"],
  },
  {
    id: "d4",
    name: "Sofia Martinez",
    title: "Creative Director",
    company: "Company D",
    majors: ["Design", "Communications"],
    interests: ["Content Creation", "Brand Strategy"],
  },
  {
    id: "d5",
    name: "Ethan Wong",
    title: "Social Media Strategist",
    company: "Company E",
    majors: ["Arts", "Communications"],
    interests: ["Social Media", "Content Creation"],
  },
];

export async function getDelegates(): Promise<Delegate[]> {
  return delegates;
}
