import { LinkSourceType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getQuestionConfigForGrade } from "../../lib/scoring/flow";

const prismaMocks = vi.hoisted(() => {
  return {
    checkupLinkFindFirst: vi.fn(),
    submissionFindFirst: vi.fn(),
    transaction: vi.fn(),
    submissionCreate: vi.fn(),
    reportCreate: vi.fn(),
  };
});

vi.mock("../../lib/db/prisma", () => ({
  prisma: {
    checkupLink: {
      findFirst: prismaMocks.checkupLinkFindFirst,
    },
    submission: {
      findFirst: prismaMocks.submissionFindFirst,
    },
    $transaction: prismaMocks.transaction,
  },
}));

import { POST } from "../../app/api/submit/route";

interface SubmitPayload {
  source: "d2c" | "school";
  schoolSlug?: string;
  parentName: string;
  parentEmail: string;
  parentWhatsapp: string;
  childName: string;
  grade: string;
  schoolName: string;
  division: string;
  housingSocietyName: string;
  answers: Record<string, string>;
}

function buildAnswersForGrade(grade: string): Record<string, string> {
  const config = getQuestionConfigForGrade(grade);

  return config.questions.reduce<Record<string, string>>((acc, question) => {
    acc[question.id] = "Never";
    return acc;
  }, {});
}

function createPayload(overrides: Partial<SubmitPayload> = {}): SubmitPayload {
  const grade = overrides.grade ?? "Nursery";
  const answers = overrides.answers ?? buildAnswersForGrade(grade);

  return {
    source: "d2c",
    parentName: "Parent One",
    parentEmail: "parent@example.com",
    parentWhatsapp: "+91 9876543210",
    childName: "Child One",
    grade,
    schoolName: "",
    division: "",
    housingSocietyName: "Palm Residency",
    answers,
    ...overrides,
  };
}

function makeRequest(payload: SubmitPayload): Request {
  return new Request("http://localhost/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMocks.checkupLinkFindFirst.mockImplementation(async ({ where }) => {
      if (where.sourceType === LinkSourceType.D2C) {
        return {
          id: "link_d2c",
          slug: "d2c-public",
          sourceType: LinkSourceType.D2C,
          schoolId: null,
          allowedGrades: [
            "Nursery",
            "Jr KG",
            "Sr KG",
            "UKG",
            "Grade 1",
            "Grade 2",
            "Grade 3",
            "Grade 4",
            "Grade 5",
          ],
          isActive: true,
          school: null,
        };
      }

      if (
        where.sourceType === LinkSourceType.SCHOOL &&
        where.slug === "greenfield-primary-school"
      ) {
        return {
          id: "link_school_1",
          slug: "greenfield-primary-school",
          sourceType: LinkSourceType.SCHOOL,
          schoolId: "school_1",
          allowedGrades: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"],
          isActive: true,
          school: {
            id: "school_1",
            name: "Greenfield Primary School",
          },
        };
      }

      return null;
    });

    prismaMocks.submissionFindFirst.mockResolvedValue(null);

    prismaMocks.submissionCreate.mockResolvedValue({
      id: "sub_1",
      resultToken: "result-token-1",
    });

    prismaMocks.reportCreate.mockResolvedValue({
      id: "report_1",
    });

    prismaMocks.transaction.mockImplementation(async (callback) => {
      return callback({
        submission: {
          create: prismaMocks.submissionCreate,
        },
        report: {
          create: prismaMocks.reportCreate,
        },
      });
    });
  });

  it("accepts a valid pre-primary D2C submission", async () => {
    const payload = createPayload({
      source: "d2c",
      grade: "Nursery",
      schoolName: "",
      division: "",
      housingSocietyName: "Palm Residency",
    });

    const response = await POST(makeRequest(payload));
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(body.token).toBe("result-token-1");
    expect(body.resultPath).toBe("/result/result-token-1");
    expect(prismaMocks.submissionCreate).toHaveBeenCalledTimes(1);
    expect(prismaMocks.reportCreate).toHaveBeenCalledTimes(1);
  });

  it("accepts a valid primary school submission", async () => {
    const payload = createPayload({
      source: "school",
      schoolSlug: "greenfield-primary-school",
      grade: "Grade 3",
      schoolName: "Greenfield Primary School",
      division: "A",
      housingSocietyName: "",
      answers: buildAnswersForGrade("Grade 3"),
    });

    const response = await POST(makeRequest(payload));
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(body.resultPath).toBe("/result/result-token-1");
    expect(prismaMocks.submissionCreate).toHaveBeenCalledTimes(1);
  });

  it("rejects missing answers", async () => {
    const payload = createPayload({
      grade: "Nursery",
    });
    delete payload.answers.pre_q20;

    const response = await POST(makeRequest(payload));
    const body = (await response.json()) as {
      message?: string;
      errors?: string[];
    };

    expect(response.status).toBe(400);
    expect(body.message).toBe("Submission validation failed.");
    expect(body.errors?.some((error) => error.includes("Missing answer"))).toBe(true);
    expect(prismaMocks.submissionCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid grade values", async () => {
    const payload = createPayload({
      grade: "Grade 9",
      answers: buildAnswersForGrade("Nursery"),
    });

    const response = await POST(makeRequest(payload));
    const body = (await response.json()) as {
      message?: string;
      errors?: string[];
    };

    expect(response.status).toBe(400);
    expect(body.message).toBe("Submission validation failed.");
    expect(
      body.errors?.some(
        (error) =>
          error.includes("Selected grade is not allowed") ||
          error.includes("Unsupported grade"),
      ),
    ).toBe(true);
    expect(prismaMocks.submissionCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid parent email format", async () => {
    const payload = createPayload({
      parentEmail: "not-an-email",
      grade: "Nursery",
    });

    const response = await POST(makeRequest(payload));
    const body = (await response.json()) as {
      message?: string;
      errors?: string[];
    };

    expect(response.status).toBe(400);
    expect(body.message).toBe("Submission validation failed.");
    expect(body.errors).toContain("Parent email is invalid.");
    expect(prismaMocks.submissionCreate).not.toHaveBeenCalled();
  });

  it("rejects school flow when division is missing", async () => {
    const payload = createPayload({
      source: "school",
      schoolSlug: "greenfield-primary-school",
      grade: "Grade 3",
      schoolName: "Greenfield Primary School",
      division: "",
      housingSocietyName: "",
      answers: buildAnswersForGrade("Grade 3"),
    });

    const response = await POST(makeRequest(payload));
    const body = (await response.json()) as {
      message?: string;
      errors?: string[];
    };

    expect(response.status).toBe(400);
    expect(body.message).toBe("Submission validation failed.");
    expect(body.errors).toContain("Division is required.");
    expect(prismaMocks.submissionCreate).not.toHaveBeenCalled();
  });

  it("rejects d2c flow when housing society name is missing", async () => {
    const payload = createPayload({
      source: "d2c",
      grade: "Grade 2",
      housingSocietyName: "",
      schoolName: "",
      division: "",
      answers: buildAnswersForGrade("Grade 2"),
    });

    const response = await POST(makeRequest(payload));
    const body = (await response.json()) as {
      message?: string;
      errors?: string[];
    };

    expect(response.status).toBe(400);
    expect(body.message).toBe("Submission validation failed.");
    expect(body.errors).toContain("Housing society name is required.");
    expect(prismaMocks.submissionCreate).not.toHaveBeenCalled();
  });

  it("prevents rapid duplicate submit and reuses existing token", async () => {
    const payload = createPayload({
      source: "d2c",
      grade: "Nursery",
    });

    prismaMocks.submissionFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "sub_1",
        resultToken: "result-token-1",
      });

    const firstResponse = await POST(makeRequest(payload));
    const firstBody = (await firstResponse.json()) as Record<string, unknown>;

    const secondResponse = await POST(makeRequest(payload));
    const secondBody = (await secondResponse.json()) as Record<string, unknown>;

    expect(firstResponse.status).toBe(201);
    expect(firstBody.resultPath).toBe("/result/result-token-1");

    expect(secondResponse.status).toBe(200);
    expect(secondBody.resultPath).toBe("/result/result-token-1");
    expect(prismaMocks.submissionCreate).toHaveBeenCalledTimes(1);
    expect(prismaMocks.reportCreate).toHaveBeenCalledTimes(1);
  });
});
