import type { Job } from "@/lib/types";

// Replace with a fetch from the UBCMA job portal once an API/feed is available.
export const jobs: Job[] = [
  {
    id: "j1",
    title: "Marketing Coordinator",
    company: "Company A",
    location: "Vancouver, BC",
    type: "Full-time",
    majors: ["Commerce", "Communications"],
    interests: ["Brand Strategy", "Content Creation"],
    url: "#",
  },
  {
    id: "j2",
    title: "Digital Marketing Intern",
    company: "Company B",
    location: "Remote",
    type: "Internship",
    majors: ["Commerce", "Arts"],
    interests: ["Digital Marketing", "Social Media"],
    url: "#",
  },
  {
    id: "j3",
    title: "Marketing Analytics Co-op",
    company: "Company C",
    location: "Vancouver, BC",
    type: "Co-op",
    majors: ["Commerce", "Statistics"],
    interests: ["Analytics", "Digital Marketing"],
    url: "#",
  },
  {
    id: "j4",
    title: "Junior Copywriter",
    company: "Company D",
    location: "Toronto, ON",
    type: "Part-time",
    majors: ["English", "Communications"],
    interests: ["Content Creation"],
    url: "#",
  },
  {
    id: "j5",
    title: "Product Marketing Associate",
    company: "Company E",
    location: "Vancouver, BC",
    type: "Full-time",
    majors: ["Computer Science", "Commerce"],
    interests: ["Product Marketing", "Consumer Insights"],
    url: "#",
  },
];

export async function getJobs(): Promise<Job[]> {
  return jobs;
}
