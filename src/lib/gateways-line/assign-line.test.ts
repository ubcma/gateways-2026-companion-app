import { describe, expect, it } from "vitest";
import { assignLine, type AssignLineInput } from "./assign-line";
import type { Line } from "./config";

const LOREAL = "L'Oréal: Brandstorm Workshop - Rethinking the Future of Beauty";
const TELUS = "Telus: Own Your Narrative - Turning Setbacks into Strategy";
const KENVUE = "Kenvue: Case Challenge - Product Innovation Strategy";
const KITS = "KITS Eyewhere: Retention-Driven Growth and a Fast-Growing Brand";
const TOCHA = "Tocha Foods: What Marketing Looks Like in a Start-Up";

function scores(General: number, Brand: number, Creative: number, Product: number) {
  return { General, Brand, Creative, Product };
}

describe("assignLine", () => {
  it.each<[string, AssignLineInput, Line, ReturnType<typeof scores>]>([
    [
      "Kenvue + KITS, marketing/sales/entrepreneurship",
      {
        workshops: [KENVUE, KITS],
        interests: "Digital Marketing, Sales, Entrepreneurship",
      },
      "General",
      scores(11, 4, 1, 6),
    ],
    [
      "L'Oréal + Tocha, brand-leaning interests",
      {
        workshops: [LOREAL, TOCHA],
        interests: "Digital Marketing, Brand Management, Graphic Design, Product Management",
      },
      "Brand",
      scores(6, 9, 8, 4),
    ],
    [
      "L'Oréal + Tocha, product-leaning interests",
      {
        workshops: [LOREAL, TOCHA],
        interests: "Product Management, Entrepreneurship, UI/UX",
      },
      "Product",
      scores(6, 4, 5, 7),
    ],
    [
      "L'Oréal + Tocha, creative-leaning interests",
      {
        workshops: [LOREAL, TOCHA],
        interests: "Digital Marketing, Graphic Design, UI/UX",
      },
      "Creative",
      scores(6, 6, 9, 3),
    ],
    [
      "L'Oréal + Tocha, five interests",
      {
        workshops: [LOREAL, TOCHA],
        interests:
          "Sales, Entrepreneurship, Brand Management, Digital Marketing, Product Management",
      },
      "General",
      scores(11, 9, 5, 5),
    ],
    [
      "Telus + KITS, no interests",
      { workshops: [TELUS, KITS], interests: null },
      "Brand",
      scores(4, 5, 3, 1),
    ],
  ])("%s", (_, input, line, expected) => {
    expect(assignLine(input)).toEqual({ line, scores: expected });
  });

  it("scores interests the same as a string or an array", () => {
    const workshops = [LOREAL, TOCHA] as const;
    expect(
      assignLine({ workshops, interests: ["Digital Marketing", "Graphic Design", "UI/UX"] }),
    ).toEqual(assignLine({ workshops, interests: "Digital Marketing, Graphic Design, UI/UX" }));
  });

  it("ignores extra whitespace and casing in interests", () => {
    expect(
      assignLine({ workshops: [null, null], interests: "  sales ,PRODUCT   management,  ui/ux " }),
    ).toEqual({ line: "Product", scores: scores(3, 1, 2, 5) });
  });

  it("matches workshop titles regardless of whitespace, casing and apostrophe style", () => {
    const loreal = "  l\u2019oréal: brandstorm  workshop - rethinking the future of beauty ";
    expect(assignLine({ workshops: [loreal, null], interests: null })).toEqual({
      line: "Brand",
      scores: scores(0, 4, 2, 0),
    });
  });

  it("ignores unknown interests and workshops instead of throwing", () => {
    expect(
      assignLine({
        workshops: ["Some Future Workshop", KENVUE],
        interests: ["Underwater Basket Weaving", "Product Management", ""],
      }),
    ).toEqual({ line: "Product", scores: scores(1, 0, 0, 7) });
  });

  it("counts a duplicated interest once", () => {
    expect(assignLine({ workshops: [null, null], interests: "Sales, sales" })).toEqual({
      line: "General",
      scores: scores(3, 1, 0, 0),
    });
  });

  it("counts the same workshop in both slots twice", () => {
    expect(assignLine({ workshops: [KENVUE, KENVUE], interests: null })).toEqual({
      line: "Product",
      scores: scores(2, 0, 0, 8),
    });
  });

  it("scores from interests only when workshops are missing", () => {
    expect(assignLine({ interests: "Graphic Design" })).toEqual({
      line: "Creative",
      scores: scores(0, 1, 3, 0),
    });
  });

  it("returns General with zero scores when both workshops are Not picked and there are no interests", () => {
    expect(assignLine({ workshops: ["Not picked", "Not picked"], interests: [] })).toEqual({
      line: "General",
      scores: scores(0, 0, 0, 0),
    });
  });

  it("breaks ties in General, Brand, Creative, Product order", () => {
    expect(assignLine({ workshops: [LOREAL, TOCHA], interests: null })).toEqual({
      line: "General",
      scores: scores(4, 4, 3, 1),
    });
    expect(assignLine({ workshops: [TELUS, "Not picked"], interests: "" })).toEqual({
      line: "Brand",
      scores: scores(1, 3, 3, 0),
    });
    expect(assignLine({ workshops: [null, null], interests: "UI/UX" })).toEqual({
      line: "Creative",
      scores: scores(0, 0, 2, 2),
    });
  });

  it.each([null, undefined, {}, 42, "Sales", []])(
    "returns General with zero scores for malformed input %j",
    (input) => {
      expect(assignLine(input as unknown as AssignLineInput)).toEqual({
        line: "General",
        scores: scores(0, 0, 0, 0),
      });
    },
  );

  it("skips malformed workshop and interest values", () => {
    const input = {
      workshops: [42, { title: KENVUE }],
      interests: [null, 7, "Consulting"],
    } as unknown as AssignLineInput;
    expect(assignLine(input)).toEqual({ line: "General", scores: scores(2, 1, 0, 1) });
  });
});
