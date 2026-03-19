import { type Address, formatEther } from "viem";
import { getClient } from "../config.js";

export interface ReputationFactors {
  transactionCount: number;
  accountAgeYears: number;
  balanceEth: number;
  hasEnsName: boolean;
  ensRecordCount: number;
}

export interface ReputationResult {
  address: Address;
  score: number;
  factors: ReputationFactors;
  breakdown: Record<string, number>;
}

// Weights for each reputation factor (sum to 100)
const WEIGHTS = {
  transactionCount: 30,
  accountAge: 25,
  balance: 20,
  ensOwnership: 15,
  ensRecords: 10,
} as const;

/**
 * Estimate account age from nonce and known Ethereum genesis (July 2015).
 * Rough heuristic: more transactions = older account.
 */
function estimateAccountAgeYears(nonce: number): number {
  const now = new Date();
  const ethGenesis = new Date("2015-07-30");
  const maxAge =
    (now.getTime() - ethGenesis.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  if (nonce === 0) return 0;
  if (nonce < 10) return Math.min(1, maxAge);
  if (nonce < 100) return Math.min(3, maxAge);
  if (nonce < 1000) return Math.min(5, maxAge);
  return Math.min(7, maxAge);
}

/**
 * Score a single factor on a 0-1 scale.
 */
function scoreTxCount(count: number): number {
  if (count === 0) return 0;
  if (count < 10) return 0.2;
  if (count < 50) return 0.4;
  if (count < 200) return 0.6;
  if (count < 1000) return 0.8;
  return 1.0;
}

function scoreAge(years: number): number {
  if (years <= 0) return 0;
  return Math.min(years / 7, 1.0);
}

function scoreBalance(ethBalance: number): number {
  if (ethBalance <= 0) return 0;
  if (ethBalance < 0.01) return 0.1;
  if (ethBalance < 0.1) return 0.3;
  if (ethBalance < 1) return 0.5;
  if (ethBalance < 10) return 0.7;
  return 1.0;
}

function scoreEnsRecords(count: number): number {
  if (count === 0) return 0;
  return Math.min(count / 5, 1.0);
}

/**
 * Calculate a reputation score (0-100) for an Ethereum address.
 */
export async function reputationScore(
  address: Address,
  ensName?: string | null,
  ensRecordCount: number = 0,
): Promise<ReputationResult> {
  const client = getClient();

  const [nonce, balance] = await Promise.all([
    client.getTransactionCount({ address }),
    client.getBalance({ address }),
  ]);

  const ethBalance = parseFloat(formatEther(balance));
  const ageYears = estimateAccountAgeYears(nonce);
  const hasEns = !!ensName;

  const breakdown: Record<string, number> = {
    transactionCount: scoreTxCount(nonce) * WEIGHTS.transactionCount,
    accountAge: scoreAge(ageYears) * WEIGHTS.accountAge,
    balance: scoreBalance(ethBalance) * WEIGHTS.balance,
    ensOwnership: (hasEns ? 1.0 : 0) * WEIGHTS.ensOwnership,
    ensRecords: scoreEnsRecords(ensRecordCount) * WEIGHTS.ensRecords,
  };

  const score = Math.round(
    Object.values(breakdown).reduce((a, b) => a + b, 0),
  );

  return {
    address,
    score: Math.min(100, Math.max(0, score)),
    factors: {
      transactionCount: nonce,
      accountAgeYears: ageYears,
      balanceEth: ethBalance,
      hasEnsName: hasEns,
      ensRecordCount,
    },
    breakdown,
  };
}

/**
 * Calculate reputation from factors directly (for offline/testing use).
 */
export function calculateScoreFromFactors(
  factors: ReputationFactors,
): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {
    transactionCount:
      scoreTxCount(factors.transactionCount) * WEIGHTS.transactionCount,
    accountAge:
      scoreAge(factors.accountAgeYears) * WEIGHTS.accountAge,
    balance: scoreBalance(factors.balanceEth) * WEIGHTS.balance,
    ensOwnership:
      (factors.hasEnsName ? 1.0 : 0) * WEIGHTS.ensOwnership,
    ensRecords:
      scoreEnsRecords(factors.ensRecordCount) * WEIGHTS.ensRecords,
  };

  const score = Math.round(
    Object.values(breakdown).reduce((a, b) => a + b, 0),
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown,
  };
}
