import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDepartmentChoice, ALL_DEPARTMENTS_VALUE } from "../src/lib/auth/department-choice.ts";

test("department choice: one department", () => {
  assert.deepEqual(parseDepartmentChoice("VentureBuilder", false), { department: "VentureBuilder", allDepartments: false });
  assert.deepEqual(parseDepartmentChoice("InvestmentDepartment", true), { department: "InvestmentDepartment", allDepartments: false });
});

test("department choice: both departments is Management-only", () => {
  assert.deepEqual(parseDepartmentChoice(ALL_DEPARTMENTS_VALUE, true), { department: null, allDepartments: true });
  assert.equal(parseDepartmentChoice(ALL_DEPARTMENTS_VALUE, false), null);
});

test("department choice: anything else is rejected", () => {
  assert.equal(parseDepartmentChoice("Marketing", true), null);
  assert.equal(parseDepartmentChoice("", true), null);
  assert.equal(parseDepartmentChoice(null, true), null);
});
