import { expect, test } from "playwright/test";

declare global {
  interface Window {
    tileSceneryTest: {
      rendered: () => boolean;
      markerVisibility: () => { total: number; visible: number }[];
      surfacePixels: (id: string, points: [number, number][]) => number[][];
    };
  }
}

for (const occlude of [false, true]) {
  test(`every claimed feature stays visible ${occlude ? "behind opaque and transparent objects" : "on all tile scenery"}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1220, height: 1300 });
    for (let group = 0; group < 4; group++) {
      await page.goto(`/e2e/tiles.html?page=${group}&markers${occlude ? "&occlude" : ""}`);
      await expect(page.locator("canvas")).toHaveCount(4);
      await expect.poll(() => page.evaluate(() => window.tileSceneryTest.rendered())).toBe(true);
      const visibility = await page.evaluate(() => window.tileSceneryTest.markerVisibility());
      for (const { total, visible } of visibility) {
        expect(total).toBeGreaterThan(500);
        expect(visible).toBe(total);
      }
      if (!occlude) await page.screenshot({ path: testInfo.outputPath(`markers-${group}.png`), fullPage: true });
    }
  });
}

test("junctions have uninterrupted asphalt and the gas-station driveway enters the parking lot", async ({ page }) => {
  await page.goto("/e2e/tiles.html?page=1");
  const pixels = await page.evaluate(() => {
    const junction: [number, number][] = [];
    for (let x = -0.075; x <= 0.075; x += 0.015)
      for (let z = -0.075; z <= 0.075; z += 0.015) junction.push([x, z]);
    return [
      ...window.tileSceneryTest.surfacePixels("three-way-road", junction),
      ...window.tileSceneryTest.surfacePixels("costco-road", [[0, 0.1], [0, 0.15]]),
    ];
  });
  for (const pixel of pixels) expect(pixel).toEqual([98, 108, 105, 255]);
});

test("all 16 tile types render in every orientation", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1220, height: 1300 });
  for (let group = 0; group < 4; group++) {
    await page.goto(`/e2e/tiles.html?page=${group}`);
    await expect(page.locator("h2")).toHaveCount(4);
    await expect(page.locator("canvas")).toHaveCount(4);
    await expect.poll(() => page.evaluate(() => window.tileSceneryTest.rendered())).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`tiles-${group}.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
});


test("feature highlights tolerate stale selections and empty polygons on every tile and rotation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (let group = 0; group < 4; group++) {
    await page.goto(`/e2e/tiles.html?page=${group}&highlights`);
    await expect(page.locator("canvas")).toHaveCount(4);
    await expect.poll(() => page.evaluate(() => window.tileSceneryTest.rendered())).toBe(true);
  }
  expect(errors).toEqual([]);
});
