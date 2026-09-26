import { expect, test } from "playwright/test";

declare global {
  interface Window {
    warehouseTest: { stats: () => { frame: number; calls: number; geometries: number } };
  }
}

test("connected warehouse layouts render and rebuild without leaking geometry", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1140, height: 830 });
  for (let example = 0; example < 5; example++) {
    await page.goto(`/e2e/warehouses.html?example=${example}`);
    await expect
      .poll(() =>
        page.evaluate(() => {
          try {
            return window.warehouseTest.stats().calls;
          } catch {
            return 0;
          }
        }),
      )
      .toBeGreaterThan(0);
    await expect(page.getByTestId("complexes")).toHaveText(example === 3 ? "2" : "1");
    const original = await page.evaluate(() => window.warehouseTest.stats());
    expect(original.calls).toBeLessThan(60);
    await page.screenshot({ path: testInfo.outputPath(`warehouse-${example}.png`), fullPage: true });
    for (let repeat = 0; repeat < 3; repeat++) {
      let frame = await page.evaluate(() => window.warehouseTest.stats().frame);
      await page.getByRole("button", { name: "Remove tile" }).click();
      await expect.poll(() => page.evaluate(() => window.warehouseTest.stats().frame)).toBeGreaterThan(frame);
      frame = await page.evaluate(() => window.warehouseTest.stats().frame);
      await page.getByRole("button", { name: "Add tile" }).click();
      await expect.poll(() => page.evaluate(() => window.warehouseTest.stats().frame)).toBeGreaterThan(frame);
      await expect.poll(() => page.evaluate(() => window.warehouseTest.stats().geometries)).toBe(original.geometries);
    }
  }
  expect(errors).toEqual([]);
});
