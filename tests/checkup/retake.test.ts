import { describe, expect, it } from "vitest";

import {
  RETAKE_WAIT_DAYS,
  evaluateRetakeEligibility,
} from "../../lib/checkup/retake";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

describe("evaluateRetakeEligibility", () => {
  it("returns first submission when no history exists", () => {
    const result = evaluateRetakeEligibility({
      submissions: [],
      now: new Date("2026-04-09T00:00:00.000Z"),
    });

    expect(result.type).toBe("FIRST_SUBMISSION");
    if (result.type === "FIRST_SUBMISSION") {
      expect(result.retakeNumber).toBe(0);
      expect(result.previousSubmissionId).toBeNull();
    }
  });

  it("returns TOO_EARLY before 30 days from original submission", () => {
    const now = new Date("2026-04-09T00:00:00.000Z");
    const originalCreatedAt = new Date(now.getTime() - 10 * DAY_IN_MS);
    const result = evaluateRetakeEligibility({
      submissions: [
        {
          id: "sub_original",
          createdAt: originalCreatedAt,
          retakeNumber: 0,
          previousSubmissionId: null,
        },
      ],
      now,
    });

    expect(result.type).toBe("TOO_EARLY");
    if (result.type === "TOO_EARLY") {
      expect(result.originalSubmissionId).toBe("sub_original");
      expect(result.daysRemaining).toBe(RETAKE_WAIT_DAYS - 10);
    }
  });

  it("allows retake exactly at 30-day boundary", () => {
    const now = new Date("2026-04-09T00:00:00.000Z");
    const originalCreatedAt = new Date(now.getTime() - RETAKE_WAIT_DAYS * DAY_IN_MS);
    const result = evaluateRetakeEligibility({
      submissions: [
        {
          id: "sub_original",
          createdAt: originalCreatedAt,
          retakeNumber: 0,
          previousSubmissionId: null,
        },
      ],
      now,
    });

    expect(result.type).toBe("ELIGIBLE_RETAKE");
    if (result.type === "ELIGIBLE_RETAKE") {
      expect(result.retakeNumber).toBe(1);
      expect(result.previousSubmissionId).toBe("sub_original");
    }
  });

  it("returns RETAKE_LIMIT_REACHED when one retake already exists", () => {
    const now = new Date("2026-04-09T00:00:00.000Z");
    const result = evaluateRetakeEligibility({
      submissions: [
        {
          id: "sub_original",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          retakeNumber: 0,
          previousSubmissionId: null,
        },
        {
          id: "sub_retake",
          createdAt: new Date("2026-03-10T00:00:00.000Z"),
          retakeNumber: 1,
          previousSubmissionId: "sub_original",
        },
      ],
      now,
    });

    expect(result.type).toBe("RETAKE_LIMIT_REACHED");
    if (result.type === "RETAKE_LIMIT_REACHED") {
      expect(result.originalSubmissionId).toBe("sub_original");
      expect(result.retakeSubmissionId).toBe("sub_retake");
    }
  });
});
