/**
 * A deliberately tiny assertion harness.
 *
 * Not a test framework: there are no fixtures, no mocking and no watch mode,
 * because the thing under test is a set of static JSON files that are rewritten
 * by a robot six times a day. What matters is that one command can say "these
 * numbers still hold" and exit non-zero when they do not.
 *
 * Two severities, and the difference is load-bearing:
 *   error — cannot be true of correct data. Fails the run, blocks the push.
 *   warn  — a data-quality measurement whose acceptable value we do not get to
 *           decide (the feed is missing what it is missing). Reported, never fatal.
 */

export type Severity = "error" | "warn";

export interface Finding {
  group: string;
  check: string;
  severity: Severity;
  detail: string;
}

interface Group {
  name: string;
  findings: Finding[];
  checks: number;
}

const groups: Group[] = [];
let current: Group | null = null;

export function group(name: string, body: () => void): void {
  current = { name, findings: [], checks: 0 };
  groups.push(current);
  try {
    body();
  } catch (err) {
    current.findings.push({
      group: name,
      check: "(group threw)",
      severity: "error",
      detail: err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err),
    });
  }
  current = null;
}

function record(check: string, severity: Severity, detail: string): void {
  if (!current) throw new Error(`check "${check}" ran outside a group()`);
  current.findings.push({ group: current.name, check, severity, detail });
}

function counted(): Group {
  if (!current) throw new Error("check ran outside a group()");
  current.checks += 1;
  return current;
}

/** Fails when `ok` is false. Use for things that cannot be true of correct data. */
export function check(name: string, ok: boolean, detail: () => string): void {
  counted();
  if (!ok) record(name, "error", detail());
}

/** Reports when `ok` is false, without failing the run. */
export function soft(name: string, ok: boolean, detail: () => string): void {
  counted();
  if (!ok) record(name, "warn", detail());
}

/**
 * Runs `predicate` over every item and reports at most `sample` offenders, so a
 * systemic break prints five lines instead of five hundred.
 */
export function every<T>(
  name: string,
  items: readonly T[],
  predicate: (item: T) => boolean,
  describe: (item: T) => string,
  severity: Severity = "error",
  sample = 5
): void {
  counted();
  const bad = items.filter((item) => !predicate(item));
  if (bad.length === 0) return;
  const shown = bad.slice(0, sample).map(describe);
  const more = bad.length > sample ? `\n    …ほか ${bad.length - sample} 件` : "";
  record(name, severity, `${bad.length}/${items.length} 件が不一致:\n    ${shown.join("\n    ")}${more}`);
}

export function equal(name: string, actual: unknown, expected: unknown, context = ""): void {
  counted();
  if (!Object.is(actual, expected)) {
    record(name, "error", `期待 ${String(expected)} / 実際 ${String(actual)}${context ? ` — ${context}` : ""}`);
  }
}

/** Equality with a tolerance, for anything that went through a division. */
export function near(name: string, actual: number, expected: number, epsilon: number, context = ""): void {
  counted();
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > epsilon) {
    record(name, "error", `期待 ${expected}±${epsilon} / 実際 ${actual}${context ? ` — ${context}` : ""}`);
  }
}

export function note(name: string, detail: string): void {
  counted();
  record(name, "warn", detail);
}

export function report(title: string): number {
  const all = groups.flatMap((g) => g.findings);
  const errors = all.filter((f) => f.severity === "error");
  const warnings = all.filter((f) => f.severity === "warn");
  const totalChecks = groups.reduce((sum, g) => sum + g.checks, 0);

  const line = "─".repeat(72);
  console.log(`\n${title}`);
  console.log(line);

  for (const g of groups) {
    const errs = g.findings.filter((f) => f.severity === "error").length;
    const warns = g.findings.filter((f) => f.severity === "warn").length;
    const mark = errs > 0 ? "NG" : warns > 0 ? "--" : "OK";
    console.log(`${mark}  ${g.name}  (${g.checks} 検査${errs ? `, ${errs} 不合格` : ""}${warns ? `, ${warns} 注意` : ""})`);
    for (const f of g.findings) {
      console.log(`      [${f.severity === "error" ? "不合格" : "注意"}] ${f.check}`);
      for (const l of f.detail.split("\n")) console.log(`        ${l}`);
    }
  }

  console.log(line);
  console.log(`検査 ${totalChecks} 件 / 不合格 ${errors.length} 件 / 注意 ${warnings.length} 件`);

  if (errors.length > 0) {
    console.log("\n不合格があります。データか導出ロジックのどちらかが壊れています。");
    return 1;
  }
  console.log("\nすべての不変条件を満たしています。");
  return 0;
}
