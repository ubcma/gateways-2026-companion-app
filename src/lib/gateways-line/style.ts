import type { Line } from "./config";

/** Matches the interest quiz's route colours. */
export const LINE_STYLE: Record<Line, { name: string; color: string; onColor: string; sweep: string }> = {
  General: {
    name: "General Line",
    color: "#183fa9",
    onColor: "#ffffff",
    sweep: "linear-gradient(90deg, #183fa9 30%, #0b183f)",
  },
  Brand: {
    name: "Brand Line",
    color: "#f6d448",
    onColor: "#000000",
    sweep: "linear-gradient(90deg, #f6d448 40%, #625428)",
  },
  Creative: {
    name: "Creative Line",
    color: "#de4d3f",
    onColor: "#ffffff",
    sweep: "linear-gradient(90deg, #de4d3f 30%, #4a1612)",
  },
  Product: {
    name: "Product Line",
    color: "#459b50",
    onColor: "#ffffff",
    sweep: "linear-gradient(90deg, #459b50 30%, #17331c)",
  },
};
