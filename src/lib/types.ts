export type Profile = {
  name: string;
  major: string;
  interests: string[];
};

export type JobType = "Full-time" | "Part-time" | "Internship" | "Co-op";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  majors: string[];
  interests: string[];
  url: string;
};

export type Match<T> = {
  item: T;
  score: number;
  sharedInterests: string[];
  sharesMajor: boolean;
};
