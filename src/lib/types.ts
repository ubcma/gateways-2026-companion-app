export type Profile = {
  name: string;
  major: string;
  interests: string[];
};

export type SessionType = "keynote" | "workshop" | "networking" | "break";

export type Session = {
  id: string;
  /** 24h "HH:MM" on the conference day */
  start: string;
  end: string;
  title: string;
  type: SessionType;
  location: string;
  speaker?: string;
  description?: string;
};

export type Delegate = {
  id: string;
  name: string;
  title: string;
  company: string;
  majors: string[];
  interests: string[];
  linkedinUrl?: string;
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
