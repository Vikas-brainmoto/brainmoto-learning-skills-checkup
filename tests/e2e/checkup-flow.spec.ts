import { expect, test, type Page } from "@playwright/test";

const TOTAL_QUESTIONS = 20;
const ANSWER_LABEL = "Sometimes";

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function answerAllQuestions(page: Page): Promise<void> {
  for (let index = 0; index < TOTAL_QUESTIONS; index += 1) {
    await expect(
      page.getByText(new RegExp(`Question ${index + 1} of ${TOTAL_QUESTIONS}`)),
    ).toBeVisible();

    await page.getByRole("radio", { name: ANSWER_LABEL }).check();

    if (index < TOTAL_QUESTIONS - 1) {
      await page.getByRole("button", { name: "Next" }).click();
    }
  }
}

async function submitQuestionStep(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Complete Question Step" }).click();
  await expect(
    page.getByText("Details and answers are valid. Submit to generate your result."),
  ).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/result\/[A-Za-z0-9_-]+$/),
    page.getByRole("button", { name: "Submit Check-Up" }).click(),
  ]);
}

test.describe("Check-Up end-to-end", () => {
  test("D2C parent flow completes and lands on result page", async ({ page }) => {
    const suffix = uniqueSuffix();
    const housingSocietyName = `Skyline Residency ${suffix}`;

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Learning Skills Check-Up/i }),
    ).toBeVisible();

    await page.getByLabel("Parent Name").fill(`Parent D2C ${suffix}`);
    await page.getByLabel("Parent Email").fill(`d2c-${suffix}@example.com`);
    await page.getByLabel("WhatsApp Number (Optional)").fill("9999999999");
    await page.getByLabel("Child Name").fill(`Child D2C ${suffix}`);
    await page.getByLabel("Grade").selectOption("Nursery");
    await page.getByLabel("Housing Society Name").fill(housingSocietyName);
    await page.getByLabel("School Name (Optional)").fill("Optional School");
    await page.getByLabel("Division (Optional)").fill("A");
    await page.getByRole("button", { name: "Continue To Questions" }).click();

    await expect(page.getByText(/Pre-primary flow\s*•\s*Question 1 of 20/i)).toBeVisible();

    await answerAllQuestions(page);
    await submitQuestionStep(page);

    await expect(page).toHaveURL(/\/result\/[A-Za-z0-9_-]+$/);
    await expect(page.getByText("Learning Ease Score")).toBeVisible();
    await expect(page.getByText("Your Learning Skills Snapshot")).toBeVisible();
    await expect(
      page.getByText(new RegExp(`Housing Society:\\s*${escapeRegExp(housingSocietyName)}`)),
    ).toBeVisible();

    const renderedText = await page.locator("body").innerText();
    expect(renderedText).not.toMatch(/\(\d+\s*\/\s*100\)/);
  });

  test("School-branded flow completes and keeps school context", async ({ page }) => {
    const suffix = uniqueSuffix();
    const division = "B";

    await page.goto("/s/greenfield-primary-school");
    await expect(
      page.getByRole("heading", { name: /Learning Skills Check-Up/i }),
    ).toBeVisible();

    const schoolName = (await page.getByLabel("School Name").inputValue()).trim();
    expect(schoolName.length).toBeGreaterThan(0);

    await page.getByLabel("Parent Name").fill(`Parent School ${suffix}`);
    await page.getByLabel("Parent Email").fill(`school-${suffix}@example.com`);
    await page.getByLabel("WhatsApp Number (Optional)").fill("8888888888");
    await page.getByLabel("Child Name").fill(`Child School ${suffix}`);
    await page.getByLabel("Grade").selectOption("Grade 2");
    await page.getByLabel("Division").fill(division);
    await page.getByRole("button", { name: "Continue To Questions" }).click();

    await expect(page.getByText(/Primary flow\s*•\s*Question 1 of 20/i)).toBeVisible();

    await answerAllQuestions(page);
    await submitQuestionStep(page);

    await expect(page).toHaveURL(/\/result\/[A-Za-z0-9_-]+$/);
    await expect(
      page.getByText(new RegExp(`School Name:\\s*${escapeRegExp(schoolName)}`)),
    ).toBeVisible();
    await expect(
      page.getByText(new RegExp(`Division:\\s*${escapeRegExp(division)}`)),
    ).toBeVisible();

    const renderedText = await page.locator("body").innerText();
    expect(renderedText).not.toContain("School Name: -");
  });
});
