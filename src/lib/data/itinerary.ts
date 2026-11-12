import type { Session } from "@/lib/types";

const sessions: Session[] = [
  {
    id: "checkin",
    start: "08:30",
    end: "09:15",
    title: "Check-in & Breakfast",
    type: "break",
    location: "Main Lobby",
  },
  {
    id: "opening-keynote",
    start: "09:15",
    end: "10:00",
    title: "Opening Keynote",
    type: "keynote",
    location: "Main Hall",
    speaker: "TBA",
    description: "Kicking off Gateways 2026.",
  },
  {
    id: "workshop-a",
    start: "10:15",
    end: "11:15",
    title: "Workshop: Building a Personal Brand",
    type: "workshop",
    location: "Room 101",
    speaker: "TBA",
  },
  {
    id: "networking-1",
    start: "11:30",
    end: "12:30",
    title: "Delegate Networking Session",
    type: "networking",
    location: "Atrium",
    description: "Meet your matched delegates.",
  },
  {
    id: "lunch",
    start: "12:30",
    end: "13:30",
    title: "Lunch",
    type: "break",
    location: "Atrium",
  },
  {
    id: "workshop-b",
    start: "13:30",
    end: "14:30",
    title: "Workshop: Data-Driven Campaigns",
    type: "workshop",
    location: "Room 102",
    speaker: "TBA",
  },
  {
    id: "closing-keynote",
    start: "15:00",
    end: "15:45",
    title: "Closing Keynote",
    type: "keynote",
    location: "Main Hall",
    speaker: "TBA",
  },
  {
    id: "networking-2",
    start: "16:00",
    end: "17:00",
    title: "Closing Reception",
    type: "networking",
    location: "Atrium",
  },
];

export async function getItinerary(): Promise<Session[]> {
  return [...sessions].sort((a, b) => a.start.localeCompare(b.start));
}
