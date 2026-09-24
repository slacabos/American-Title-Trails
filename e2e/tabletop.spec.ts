import { expect, test, Page } from "playwright/test";

type Position = { x: number; y: number };
declare global {
  interface Window {
    tabletopTest: {
      state: () => {
        count: number;
        drawStage: "river" | "land";
        tileId?: string;
        riverCount: number;
        phase: string;
        orientation: number;
        legal: Position[];
        scores: number[];
        claims: unknown[];
        over: boolean;
      };
      point: (position: Position) => Position;
      renderedLegal: () => Position[];
      completedMarkers: () => number;
      stats: () => {
        calls: number;
        triangles: number;
        frame: number;
        zoom: number;
        camera: number[];
        geometries: number;
        textures: number;
      };
      loseContext: () => void;
      previewFrame: () => number;
      losePreviewContext: () => void;
    };
  }
}
async function ready(page: Page, suffix = "") {
  await page.goto(`/e2e/tabletop.html${suffix}`);
  await expect(page.getByTestId("board-3d")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        try {
          return window.tabletopTest.stats().calls;
        } catch {
          return 0;
        }
      }),
    )
    .toBeGreaterThan(0);
}
async function legalPoint(page: Page) {
  for (let i = 0; i < 4; i++) {
    const legal = await page.evaluate(() => window.tabletopTest.state().legal);
    if (legal.length) {
      // Demand frames can belong to an earlier orientation. Wait for the actual
      // legal-cell geometry to reach the scene before clicking its projection.
      await expect.poll(() => page.evaluate(() => window.tabletopTest.renderedLegal())).toEqual(legal);
      return page.evaluate(
        (position) => window.tabletopTest.point(position),
        legal[0],
      );
    }
    const frame = await page.evaluate(() => window.tabletopTest.stats().frame);
    await page
      .getByRole("button", { name: "Rotate tile", exact: true })
      .click();
    // Legal cells in the DOM update before the separate R3F root has drawn
    // them. Click the rendered orientation, not the previous frame's cells.
    await expect.poll(() => page.evaluate(() => window.tabletopTest.stats().frame)).toBeGreaterThan(frame);
  }
  throw new Error("No legal placement in any rotation");
}

test("the 3D preview redraws every quarter turn and returns to its original image", async ({ page }) => {
  await ready(page);
  const preview = page.locator(".tabletop-tile-preview canvas");
  await expect(preview).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.tabletopTest.previewFrame())).toBeGreaterThan(0);
  const original = await preview.screenshot();
  let previous = original;
  for (let rotation = 1; rotation <= 4; rotation++) {
    const frame = await page.evaluate(() => window.tabletopTest.previewFrame());
    await page.getByRole("button", { name: "Rotate tile", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.tabletopTest.previewFrame())).toBeGreaterThan(frame);
    const current = await preview.screenshot();
    expect(current.equals(previous)).toBe(false);
    if (rotation === 4) expect(current.equals(original)).toBe(true);
    previous = current;
  }
  const idleFrame = await page.evaluate(() => window.tabletopTest.previewFrame());
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.tabletopTest.previewFrame())).toBe(idleFrame);
});

test("a preview context failure keeps the board and game in 3D", async ({ page }) => {
  await ready(page);
  await expect.poll(() => page.evaluate(() => window.tabletopTest.previewFrame())).toBeGreaterThan(0);
  const state = await page.evaluate(() => window.tabletopTest.state());
  await page.evaluate(() => window.tabletopTest.losePreviewContext());
  await expect(page.locator(".tile-renderer-container")).toBeVisible();
  await expect(page.getByTestId("board-3d")).toBeVisible();
  await expect(page.getByRole("button", { name: "3D scenery" })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => window.tabletopTest.state())).toEqual(state);
  const point = await legalPoint(page);
  await page.mouse.click(point.x, point.y);
  await expect(page.getByTestId("tile-count")).toHaveText("2");
  await page.getByRole("button", { name: "Skip claim" }).click();
  await expect(page.locator(".tile-renderer-container")).toBeVisible();
  await expect(page.getByTestId("board-3d")).toBeVisible();
});

test("placement and claiming reuse the same preview canvas across turns", async ({ page }, testInfo) => {
  await ready(page);
  const canvas = await page.locator(".tabletop-tile-preview canvas").elementHandle();
  expect(canvas).not.toBeNull();
  for (let turn = 0; turn < 20; turn++) {
    const state = await page.evaluate(() => window.tabletopTest.state());
    expect(state.drawStage).toBe(turn < 11 ? "river" : "land");
    if (turn === 10) expect(state.tileId).toBe("river-lake");
    if (turn === 11) {
      expect(state.riverCount).toBe(12);
      await page.screenshot({ path: testInfo.outputPath("completed-river-3d.png"), fullPage: true });

    }
    await expect.poll(() => page.evaluate(() => window.tabletopTest.previewFrame())).toBeGreaterThan(0);
    const boardFrame = await page.evaluate(() => window.tabletopTest.stats().frame);
    await page.getByRole("button", { name: "Fit board", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.tabletopTest.stats().frame)).toBeGreaterThan(boardFrame);
    const point = await legalPoint(page);
    await page.mouse.click(point.x, point.y);
    await expect(page.getByTestId("tile-count")).toHaveText(String(turn + 2));
    expect(await canvas!.evaluate((element) => element.isConnected)).toBe(true);
    await expect(page.locator(".tabletop-tile-preview")).toBeHidden();
    const claimFrame = await page.evaluate(() => window.tabletopTest.previewFrame());
    await page.getByRole("button", { name: "Skip claim" }).click();
    await expect(page.locator(".tabletop-tile-preview")).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.tabletopTest.previewFrame())).toBeGreaterThan(claimFrame);
    expect(await canvas!.evaluate((element) => element === document.querySelector(".tabletop-tile-preview canvas"))).toBe(true);
    await expect(page.getByTestId("board-3d")).toBeVisible();
  }
  // R3F's delayed context teardown must not switch a later turn to 2D.
  await page.waitForTimeout(700);
  await expect(page.getByTestId("board-3d")).toBeVisible();
});

test("desktop placement, dragging, rotation, claiming and view switching preserve the game", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  const start = await legalPoint(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 80, start.y + 30, { steps: 8 });
  await page.mouse.up();
  expect(await page.evaluate(() => window.tabletopTest.state().count)).toBe(1);
  const manualCamera = await page.evaluate(
    () => window.tabletopTest.stats().camera,
  );
  await page.getByRole("button", { name: "Rotate tile", exact: true }).click();
  expect(await page.evaluate(() => window.tabletopTest.stats().camera)).toEqual(
    manualCamera,
  );
  await page.getByRole("button", { name: "Fit board", exact: true }).click();
  const placement = await legalPoint(page);
  await page.mouse.move(placement.x, placement.y);
  await page.mouse.click(placement.x, placement.y);
  await expect(page.getByTestId("tile-count")).toHaveText("2");
  await expect(page.getByTestId("phase")).toHaveText("claim_feature");
  await page
    .getByRole("button", { name: /^Claim / })
    .first()
    .click();
  await expect(page.getByTestId("phase")).toHaveText("place_tile");
  const state = await page.evaluate(() => window.tabletopTest.state());
  expect(state.claims.length).toBeGreaterThan(0);
  await page.getByRole("button", { name: "2D classic" }).click();
  await expect(page.locator(".board-canvas-container")).toBeVisible();
  expect(await page.evaluate(() => window.tabletopTest.state())).toEqual(state);
  await page.getByRole("button", { name: "3D scenery" }).click();
  await expect(page.getByTestId("board-3d")).toBeVisible();
  expect(await page.evaluate(() => window.tabletopTest.state())).toEqual(state);
  expect(errors).toEqual([]);
});

test("tablet tap previews before confirmation and fits without horizontal overflow", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 820, height: 1180 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await ready(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const point = await legalPoint(page);
  await page.touchscreen.tap(point.x, point.y);
  await expect(
    page.getByRole("button", { name: "Place tile", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.tabletopTest.state().count)).toBe(1);
  await page.getByRole("button", { name: "Cancel", exact: true }).tap();
  expect(await page.evaluate(() => window.tabletopTest.state().count)).toBe(1);
  await page.touchscreen.tap(point.x, point.y);
  await page.getByRole("button", { name: "Place tile", exact: true }).tap();
  await expect(page.getByTestId("tile-count")).toHaveText("2");
  await page.screenshot({
    path: "test-results/tabletop-tablet.png",
    fullPage: true,
  });
  await context.close();
});

test("pinch zoom never places a tile or opens a confirmation", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 820, height: 1180 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await ready(page);
  const point = await legalPoint(page);
  const before = await page.evaluate(() => window.tabletopTest.stats().zoom);
  const client = await context.newCDPSession(page);
  const touches = (distance: number) => [
    { x: point.x - distance, y: point.y, id: 1 },
    { x: point.x + distance, y: point.y, id: 2 },
  ];
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: touches(30),
  });
  for (const distance of [40, 50, 65])
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: touches(distance),
    });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(await page.evaluate(() => window.tabletopTest.state().count)).toBe(1);
  await expect(
    page.getByRole("button", { name: "Place tile", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => window.tabletopTest.stats().zoom),
  ).toBeGreaterThan(before);
  await context.close();
});

test("context loss falls back without losing tiles, claims or scores", async ({
  page,
}) => {
  await ready(page);
  const point = await legalPoint(page);
  await page.mouse.click(point.x, point.y);
  await expect(page.getByTestId("tile-count")).toHaveText("2");
  const before = await page.evaluate(() => window.tabletopTest.state());
  await page.evaluate(() => window.tabletopTest.loseContext());
  await expect(page.locator(".board-canvas-container")).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Your game continues in 2D",
  );
  expect(await page.evaluate(() => window.tabletopTest.state())).toEqual(
    before,
  );
});

test("devices without WebGL start in the working classic view", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/e2e/tabletop.html");
  await expect(page.locator(".board-canvas-container")).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Your game continues in 2D",
  );
});

test("full-deck scenery renders efficiently and stops drawing when idle", async ({
  page,
}) => {
  await ready(page, "?full");
  expect(await page.evaluate(() => window.tabletopTest.state().over)).toBe(
    true,
  );
  expect(
    await page.evaluate(() => window.tabletopTest.state().count),
  ).toBeGreaterThan(40);
  await page.waitForTimeout(500);
  const first = await page.evaluate(() => window.tabletopTest.stats());
  expect(first.calls).toBeLessThan(350);
  expect(first.triangles).toBeLessThan(150000);
  await page.waitForTimeout(500);
  expect((await page.evaluate(() => window.tabletopTest.stats())).frame).toBe(
    first.frame,
  );
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.tabletopTest.stats().frame))
    .toBeGreaterThan(first.frame);
  await page.screenshot({
    path: "test-results/tabletop-full-deck.png",
    fullPage: true,
  });
  console.log("Full-deck rendering:", first);
});

test("the production game opens in 3D and keeps its current tile when switching views", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start Game" }).click();
  await expect(page.getByTestId("board-3d")).toBeVisible();
  const name = await page
    .locator(".tabletop-tile-preview")
    .getAttribute("aria-label");
  await page.getByRole("button", { name: "2D classic" }).click();
  await expect(page.locator(".board-canvas-container")).toBeVisible();
  await page.getByRole("button", { name: "3D scenery" }).click();
  await expect(page.locator(".tabletop-tile-preview")).toHaveAttribute(
    "aria-label",
    name!,
  );
  await page.waitForTimeout(300);
  const preview = page.locator(".tabletop-tile-preview canvas");
  const original = await preview.screenshot();
  await page.getByTitle("Rotate clockwise (R)", { exact: true }).click();
  await expect.poll(async () => (await preview.screenshot()).equals(original)).toBe(false);
  await page.getByTitle("Rotate counter-clockwise (Shift+R)", { exact: true }).click();
  await expect.poll(async () => (await preview.screenshot()).equals(original)).toBe(true);
  await page.keyboard.press("r");
  await expect.poll(async () => (await preview.screenshot()).equals(original)).toBe(false);
  await page.keyboard.press("Shift+R");
  await expect.poll(async () => (await preview.screenshot()).equals(original)).toBe(true);
  await page.screenshot({
    path: "test-results/tabletop-game.png",
    fullPage: true,
  });
});
