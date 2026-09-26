import { readFile } from "node:fs/promises";
import coverage from "istanbul-lib-coverage";
import reporting from "istanbul-lib-report";
import reports from "istanbul-reports";

// WebGL components are exercised in Chromium, while the engine runs in jsdom.
// Apply the repository's coverage gate to both suites together.
const map = coverage.createCoverageMap({});
for (const path of ["coverage/unit/coverage-final.json", "coverage/storybook/coverage-final.json"]) {
  map.merge(JSON.parse(await readFile(path, "utf8")));
}
const context = reporting.createContext({ dir: "coverage/combined", coverageMap: map });
for (const format of ["text-summary", "json-summary", "html"]) {
  reports.create(format).execute(context);
}
const summary = map.getCoverageSummary();
for (const metric of ["lines", "statements", "branches", "functions"]) {
  if (Number(summary[metric].pct) < 80) {
    console.error(`${metric} coverage ${summary[metric].pct}% is below the 80% target.`);
    process.exitCode = 1;
  }
}
