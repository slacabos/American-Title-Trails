import { expect, test, type Page } from "playwright/test";

const SAVE_KEY = "american-tile-trails.save";

const savedActions = (page: Page) =>
  page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw).actions as { type: string }[]) : [];
  }, SAVE_KEY);

test("an unfinished game survives a reload", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.getByRole("button", { name: "Start Game" }).click();
  await expect(page.getByTestId("board-3d")).toBeVisible();

  // Place the first river tile with the keyboard, rotating until it fits.
  for (let turn = 0; turn < 4 && (await savedActions(page)).length === 0; turn++) {
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    if ((await savedActions(page)).length === 0) await page.keyboard.press("e");
  }
  await expect.poll(async () => (await savedActions(page)).length).toBeGreaterThan(0);
  if (await page.getByRole("button", { name: "Skip" }).isVisible()) await page.keyboard.press("x");

  // Let both computer players move.
  await expect
    .poll(async () => (await savedActions(page)).filter((a) => a.type === "place").length, {
      timeout: 20_000,
    })
    .toBeGreaterThanOrEqual(3);

  await page.reload();
  const placed = (await savedActions(page)).filter((a) => a.type === "place" || a.type === "discard").length;
  await page.getByRole("button", { name: "Continue game" }).click();
  await expect(page.getByTestId("board-3d")).toBeVisible();
  await expect(page.getByText(new RegExp(`^${placed}/\\d+ tiles$`))).toBeVisible();
  await expect(page.getByText("Game resumed.")).toBeVisible();
  expect(errors).toEqual([]);
});
