import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeBenchmarksDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { getPortfolioBenchmarks } = await import("../src/lib/admin/benchmarking.ts");
const { ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const ADMIN_ROLE = [{ role: "FALAK_OPERATIONS" }];

test("denies a caller with no Falak role", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeBenchmarksDbStub({ falakRoles: [], companies: [] }));
  await assert.rejects(() => getPortfolioBenchmarks("Q2 2026"), ForbiddenError);
});

test("the best of three peers on a lower-is-better metric gets the highest percentile", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeBenchmarksDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        { id: "co_1", slug: "a", nameEn: "A", nameAr: "A", cycles: [{ periodLabel: "Q2 2026", templateId: "t1", submissionId: "s1" }] },
        { id: "co_2", slug: "b", nameEn: "B", nameAr: "B", cycles: [{ periodLabel: "Q2 2026", templateId: "t1", submissionId: "s2" }] },
        { id: "co_3", slug: "c", nameEn: "C", nameAr: "C", cycles: [{ periodLabel: "Q2 2026", templateId: "t1", submissionId: "s3" }] },
      ],
      metricsBySubmissionId: {
        s1: [{ key: "cust_churn_rate", value: 2, dataType: "Percent" }],
        s2: [{ key: "cust_churn_rate", value: 10, dataType: "Percent" }],
        s3: [{ key: "cust_churn_rate", value: 20, dataType: "Percent" }],
      },
    })
  );

  const benchmarks = await getPortfolioBenchmarks("Q2 2026");
  const a = benchmarks.find((b) => b.companyId === "co_1")!;
  const c = benchmarks.find((b) => b.companyId === "co_3")!;
  assert.equal(a.metrics.find((m) => m.key === "cust_churn_rate")!.percentile, 100, "lowest churn beats both peers");
  assert.equal(c.metrics.find((m) => m.key === "cust_churn_rate")!.percentile, 0, "highest churn beats no peers");
});

test("a higher-is-better metric (ARPU) ranks the highest value first", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeBenchmarksDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        { id: "co_1", slug: "a", nameEn: "A", nameAr: "A", cycles: [{ periodLabel: "Q2 2026", templateId: "t1", submissionId: "s1" }] },
        { id: "co_2", slug: "b", nameEn: "B", nameAr: "B", cycles: [{ periodLabel: "Q2 2026", templateId: "t1", submissionId: "s2" }] },
      ],
      metricsBySubmissionId: {
        s1: [{ key: "cust_arpu", value: 100, dataType: "Currency" }],
        s2: [{ key: "cust_arpu", value: 50, dataType: "Currency" }],
      },
    })
  );

  const benchmarks = await getPortfolioBenchmarks("Q2 2026");
  const a = benchmarks.find((b) => b.companyId === "co_1")!;
  assert.equal(a.metrics.find((m) => m.key === "cust_arpu")!.percentile, 100);
});

test("a company with no peers reporting the metric gets percentile null, not 100", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeBenchmarksDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        { id: "co_1", slug: "a", nameEn: "A", nameAr: "A", cycles: [{ periodLabel: "Q2 2026", templateId: "t1", submissionId: "s1" }] },
      ],
      metricsBySubmissionId: { s1: [{ key: "cust_churn_rate", value: 5, dataType: "Percent" }] },
    })
  );

  const benchmarks = await getPortfolioBenchmarks("Q2 2026");
  assert.equal(benchmarks[0].metrics.find((m) => m.key === "cust_churn_rate")!.percentile, null);
});

test("a company that didn't report any benchmark metric is excluded entirely", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeBenchmarksDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        { id: "co_1", slug: "a", nameEn: "A", nameAr: "A", cycles: [{ periodLabel: "Q2 2026", templateId: "t1", submissionId: "s1" }] },
      ],
      metricsBySubmissionId: { s1: [] },
    })
  );

  const benchmarks = await getPortfolioBenchmarks("Q2 2026");
  assert.equal(benchmarks.length, 0);
});

test("a company with no cycle for the requested period is excluded", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeBenchmarksDbStub({
      falakRoles: ADMIN_ROLE,
      companies: [
        { id: "co_1", slug: "a", nameEn: "A", nameAr: "A", cycles: [{ periodLabel: "Q1 2026", templateId: "t1", submissionId: "s1" }] },
      ],
      metricsBySubmissionId: { s1: [{ key: "cust_churn_rate", value: 5, dataType: "Percent" }] },
    })
  );

  const benchmarks = await getPortfolioBenchmarks("Q2 2026");
  assert.equal(benchmarks.length, 0);
});
