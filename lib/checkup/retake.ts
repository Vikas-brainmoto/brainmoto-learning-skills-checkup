const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const RETAKE_WAIT_DAYS = 30;

export interface RetakeSubmissionRecord {
  id: string;
  createdAt: Date;
  retakeNumber: number;
  previousSubmissionId: string | null;
}

interface EvaluateRetakeEligibilityInput {
  submissions: RetakeSubmissionRecord[];
  now?: Date;
}

export type RetakeEligibilityDecision =
  | {
      type: "FIRST_SUBMISSION";
      retakeNumber: 0;
      previousSubmissionId: null;
    }
  | {
      type: "TOO_EARLY";
      retakeNumber: 0;
      previousSubmissionId: null;
      originalSubmissionId: string;
      nextEligibleAt: Date;
      daysRemaining: number;
    }
  | {
      type: "ELIGIBLE_RETAKE";
      retakeNumber: 1;
      previousSubmissionId: string;
      originalSubmissionId: string;
      nextEligibleAt: Date;
    }
  | {
      type: "RETAKE_LIMIT_REACHED";
      retakeNumber: 0;
      previousSubmissionId: null;
      originalSubmissionId: string;
      retakeSubmissionId: string;
    };

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * DAY_IN_MS);
}

export function evaluateRetakeEligibility({
  submissions,
  now = new Date(),
}: EvaluateRetakeEligibilityInput): RetakeEligibilityDecision {
  if (submissions.length === 0) {
    return {
      type: "FIRST_SUBMISSION",
      retakeNumber: 0,
      previousSubmissionId: null,
    };
  }

  const sorted = [...submissions].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
  );
  const original = sorted[0];
  const existingRetake = sorted.find(
    (submission) =>
      submission.retakeNumber > 0 || submission.previousSubmissionId !== null,
  );

  if (existingRetake) {
    return {
      type: "RETAKE_LIMIT_REACHED",
      retakeNumber: 0,
      previousSubmissionId: null,
      originalSubmissionId: original.id,
      retakeSubmissionId: existingRetake.id,
    };
  }

  const nextEligibleAt = addDays(original.createdAt, RETAKE_WAIT_DAYS);

  if (now.getTime() < nextEligibleAt.getTime()) {
    const diffMs = nextEligibleAt.getTime() - now.getTime();

    return {
      type: "TOO_EARLY",
      retakeNumber: 0,
      previousSubmissionId: null,
      originalSubmissionId: original.id,
      nextEligibleAt,
      daysRemaining: Math.max(1, Math.ceil(diffMs / DAY_IN_MS)),
    };
  }

  return {
    type: "ELIGIBLE_RETAKE",
    retakeNumber: 1,
    previousSubmissionId: original.id,
    originalSubmissionId: original.id,
    nextEligibleAt,
  };
}
