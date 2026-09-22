import { expect, test } from "playwright/test";

test("completed Costcos stay identifiable in both board views", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/e2e/tabletop.html?full=1&seed=17");
  await expect(page.getByTestId("board-3d")).toBeVisible();
  const completed = page.getByText(/Completed Costcos: [1-9]/);
  await expect(completed).toBeVisible();
  const count = Number((await completed.textContent())?.match(/\d+/)?.[0]);
  await expect.poll(() => page.evaluate(() => window.tabletopTest.completedMarkers())).toBe(count);
  await page.screenshot({ path: testInfo.outputPath("finished-costcos-3d.png"), fullPage: true });

  await page.getByRole("button", { name: "2D classic" }).click();
  await expect(page.locator(".board-canvas-container")).toBeVisible();
  await expect(completed).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("finished-costcos-2d.png"), fullPage: true });
  expect(errors).toEqual([]);
});
