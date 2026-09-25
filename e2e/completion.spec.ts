import { expect, test } from "playwright/test";

test("completed Costcos stay identifiable in both camera views", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/e2e/tabletop.html?full=1&seed=17");
  await expect(page.getByTestId("board-3d")).toBeVisible();
  const completed = page.getByText(/Completed Costcos: [1-9]/);
  await expect(completed).toBeVisible();
  const count = Number((await completed.textContent())?.match(/\d+/)?.[0]);
  await expect.poll(() => page.evaluate(() => window.tabletopTest.completedMarkers())).toBe(count);
  await page.screenshot({ path: testInfo.outputPath("finished-costcos-3d.png"), fullPage: true });
  for (let zoom = 0; zoom < 4; zoom++) {
    await page.getByRole("button", { name: "Zoom in" }).click();
  }
  await page.screenshot({ path: testInfo.outputPath("finished-costcos-3d-close.png"), fullPage: true });

  await page.getByRole("button", { name: "Drone" }).click();
  // The drone camera settles directly above its target.
  await expect.poll(async () => {
    const [x, , z] = await page.evaluate(() => window.tabletopTest.stats().camera);
    const target = await page.evaluate(() => window.tabletopTest.cameraTarget());
    return Math.hypot(x - target[0], z - target[2]);
  }).toBeLessThan(0.01);
  await expect(completed).toBeVisible();
  expect(await page.evaluate(() => window.tabletopTest.completedMarkers())).toBe(count);
  await page.screenshot({ path: testInfo.outputPath("finished-costcos-drone.png"), fullPage: true });
  expect(errors).toEqual([]);
});
