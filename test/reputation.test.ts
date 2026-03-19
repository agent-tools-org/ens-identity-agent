import { describe, it, expect } from "vitest";
import {
  calculateScoreFromFactors,
  type ReputationFactors,
} from "../src/agent/reputation.js";

describe("reputation", () => {
  it("should return score 0 for empty account", () => {
    const factors: ReputationFactors = {
      transactionCount: 0,
      accountAgeYears: 0,
      balanceEth: 0,
      hasEnsName: false,
      ensRecordCount: 0,
    };

    const result = calculateScoreFromFactors(factors);
    expect(result.score).toBe(0);
  });

  it("should return max score for highly active account", () => {
    const factors: ReputationFactors = {
      transactionCount: 5000,
      accountAgeYears: 7,
      balanceEth: 100,
      hasEnsName: true,
      ensRecordCount: 10,
    };

    const result = calculateScoreFromFactors(factors);
    expect(result.score).toBe(100);
  });

  it("should give partial score for moderate activity", () => {
    const factors: ReputationFactors = {
      transactionCount: 100,
      accountAgeYears: 3,
      balanceEth: 1,
      hasEnsName: true,
      ensRecordCount: 2,
    };

    const result = calculateScoreFromFactors(factors);
    expect(result.score).toBeGreaterThan(30);
    expect(result.score).toBeLessThan(80);
  });

  it("should weight transaction count heavily", () => {
    const lowTx: ReputationFactors = {
      transactionCount: 5,
      accountAgeYears: 0,
      balanceEth: 0,
      hasEnsName: false,
      ensRecordCount: 0,
    };

    const highTx: ReputationFactors = {
      transactionCount: 2000,
      accountAgeYears: 0,
      balanceEth: 0,
      hasEnsName: false,
      ensRecordCount: 0,
    };

    const lowResult = calculateScoreFromFactors(lowTx);
    const highResult = calculateScoreFromFactors(highTx);

    expect(highResult.score).toBeGreaterThan(lowResult.score);
    expect(highResult.breakdown["transactionCount"]).toBe(30); // max weight
  });

  it("should include ENS ownership as a factor", () => {
    const withEns: ReputationFactors = {
      transactionCount: 100,
      accountAgeYears: 2,
      balanceEth: 1,
      hasEnsName: true,
      ensRecordCount: 3,
    };

    const withoutEns: ReputationFactors = {
      ...withEns,
      hasEnsName: false,
      ensRecordCount: 0,
    };

    const withResult = calculateScoreFromFactors(withEns);
    const withoutResult = calculateScoreFromFactors(withoutEns);

    expect(withResult.score).toBeGreaterThan(withoutResult.score);
  });

  it("should return breakdown of all scoring components", () => {
    const factors: ReputationFactors = {
      transactionCount: 50,
      accountAgeYears: 2,
      balanceEth: 0.5,
      hasEnsName: true,
      ensRecordCount: 3,
    };

    const result = calculateScoreFromFactors(factors);

    expect(result.breakdown).toHaveProperty("transactionCount");
    expect(result.breakdown).toHaveProperty("accountAge");
    expect(result.breakdown).toHaveProperty("balance");
    expect(result.breakdown).toHaveProperty("ensOwnership");
    expect(result.breakdown).toHaveProperty("ensRecords");

    // Sum of breakdown should equal score
    const sum = Math.round(
      Object.values(result.breakdown).reduce((a, b) => a + b, 0),
    );
    expect(sum).toBe(result.score);
  });

  it("should cap score at 100", () => {
    const factors: ReputationFactors = {
      transactionCount: 100000,
      accountAgeYears: 100,
      balanceEth: 100000,
      hasEnsName: true,
      ensRecordCount: 100,
    };

    const result = calculateScoreFromFactors(factors);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
