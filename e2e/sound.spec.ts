import { expect, test, type Page } from "playwright/test";

/** Counts the oscillators the game starts, i.e. the sounds it plays. */
const countSounds = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { soundsStarted: number };
    w.soundsStarted = 0;
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function (this: AudioContext) {
      w.soundsStarted++;
      return create.call(this);
    };
  });
const started = (page: Page) => page.evaluate(() => (window as unknown as { soundsStarted: number }).soundsStarted);

async function placeFirstTile(page: Page) {
  await page.getByRole("button", { name: "Start Game" }).click();
  await expect(page.getByTestId("board-3d")).toBeVisible();
  for (let turn = 0; turn < 4 && !(await page.getByText(/^1\/\d+ tiles$/).isVisible()); turn++) {
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    if (!(await page.getByText(/^1\/\d+ tiles$/).isVisible())) await page.keyboard.press("e");
  }
  await expect(page.getByText(/^1\/\d+ tiles$/)).toBeVisible();
}

test("placing a tile plays synthesized sound", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await countSounds(page);
  await page.goto("/");
  await placeFirstTile(page);
  await expect.poll(() => started(page)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("a muted game stays silent, across reloads", async ({ page }) => {
  await countSounds(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Start Game" }).click();
  await page.getByRole("button", { name: "Mute sound" }).click();
  await page.reload();
  await placeFirstTile(page);
  await expect(page.getByRole("button", { name: "Turn sound on" })).toBeVisible();
  await page.waitForTimeout(800);
  expect(await started(page)).toBe(0);
});
