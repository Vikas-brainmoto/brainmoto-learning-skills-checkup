import { describe, expect, it } from "vitest";

import { getQuestionConfigForGrade, resolveFlowFromGrade } from "../../lib/scoring/flow";

describe("grade-driven flow branching", () => {
  it("maps pre-primary grades to preprimary flow", () => {
    expect(resolveFlowFromGrade("Nursery")).toBe("preprimary");
    expect(resolveFlowFromGrade("Jr KG")).toBe("preprimary");
    expect(resolveFlowFromGrade("UKG")).toBe("preprimary");
  });

  it("maps primary grades to primary flow", () => {
    expect(resolveFlowFromGrade("Grade 1")).toBe("primary");
    expect(resolveFlowFromGrade("Grade 3")).toBe("primary");
    expect(resolveFlowFromGrade("Grade 5")).toBe("primary");
  });

  it("returns null for unsupported grade", () => {
    expect(resolveFlowFromGrade("Grade 6")).toBeNull();
  });

  it("loads pre-primary question config for a pre-primary grade", () => {
    const config = getQuestionConfigForGrade("Sr KG");
    expect(config.flow).toBe("preprimary");
    expect(config.questions).toHaveLength(20);
  });

  it("loads primary question config for a primary grade", () => {
    const config = getQuestionConfigForGrade("Grade 4");
    expect(config.flow).toBe("primary");
    expect(config.questions).toHaveLength(20);
  });

  it("throws for unsupported grade", () => {
    expect(() => getQuestionConfigForGrade("Middle School")).toThrow(
      'Unsupported grade "Middle School" for question branching.',
    );
  });
});
