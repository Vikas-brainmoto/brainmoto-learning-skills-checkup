import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScoreHero } from "../../components/report/ScoreHero";

function renderScoreHero(level: "Doing Well" | "Still Developing" | "Requires Support") {
  return renderToStaticMarkup(
    createElement(ScoreHero, {
      source: "d2c",
      childName: "Test Child",
      grade: "Grade 2",
      schoolName: null,
      division: null,
      housingSocietyName: "Test Society",
      logoUrl: "/logo.webp",
      finalScore: 70,
      finalLevel: level,
      parentEmail: "parent@example.com",
      reportPath: "/report/token-1",
    }),
  );
}

describe("ScoreHero score tone mapping", () => {
  it("uses green score tone when final level is Doing Well", () => {
    const markup = renderScoreHero("Doing Well");

    expect(markup).toContain("ls-score-number ls-score-tone-green");
  });

  it("uses amber score tone when final level is Still Developing", () => {
    const markup = renderScoreHero("Still Developing");

    expect(markup).toContain("ls-score-number ls-score-tone-amber");
  });

  it("uses red score tone when final level is Requires Support", () => {
    const markup = renderScoreHero("Requires Support");

    expect(markup).toContain("ls-score-number ls-score-tone-red");
  });
});
