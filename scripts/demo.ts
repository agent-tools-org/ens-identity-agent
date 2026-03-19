import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { resolveAddress, getTextRecord } from "../src/ens/resolver.js";
import { buildAgentProfile } from "../src/agent/identity-agent.js";
import { reputationScore } from "../src/agent/reputation.js";
import { listKnownAgentNames, discoverAgents } from "../src/discovery/registry.js";

const ENS_NAMES = ["vitalik.eth", "nick.eth", "brantly.eth"];

const TEXT_KEYS = ["avatar", "description", "url", "com.twitter", "com.github"];

interface DemoResult {
  timestamp: string;
  agents: Array<{
    ensName: string;
    address: string | null;
    textRecords: Record<string, string | null>;
    reputation: {
      score: number;
      factors: Record<string, unknown>;
      breakdown: Record<string, number>;
    } | null;
  }>;
  knownAgentNames: string[];
}

async function runDemo(): Promise<void> {
  console.log("=== ENS Identity Agent — Demo ===\n");
  console.log(`Resolving ${ENS_NAMES.length} ENS names on mainnet...\n`);

  const results: DemoResult = {
    timestamp: new Date().toISOString(),
    agents: [],
    knownAgentNames: listKnownAgentNames(),
  };

  for (const name of ENS_NAMES) {
    console.log(`--- ${name} ---`);

    try {
      const address = await resolveAddress(name);
      console.log(`  Address: ${address ?? "N/A"}`);

      const textRecords: Record<string, string | null> = {};
      for (const key of TEXT_KEYS) {
        const value = await getTextRecord(name, key);
        textRecords[key] = value;
        if (value) {
          console.log(`  ${key}: ${value}`);
        }
      }

      let reputation = null;
      if (address) {
        const recordCount = Object.values(textRecords).filter(Boolean).length;
        const rep = await reputationScore(address, name, recordCount);
        reputation = {
          score: rep.score,
          factors: rep.factors,
          breakdown: rep.breakdown,
        };
        console.log(`  Reputation Score: ${rep.score}/100`);
        console.log(`    Transaction Count: ${rep.factors.transactionCount}`);
        console.log(`    Balance: ${rep.factors.balanceEth.toFixed(4)} ETH`);
      }

      results.agents.push({
        ensName: name,
        address,
        textRecords,
        reputation,
      });
    } catch (err) {
      console.error(
        `  Error: ${err instanceof Error ? err.message : String(err)}`,
      );
      results.agents.push({
        ensName: name,
        address: null,
        textRecords: {},
        reputation: null,
      });
    }

    console.log();
  }

  // --- Formatted Profile Card ---
  console.log("=== Agent Profile Cards ===\n");
  for (const agent of results.agents) {
    const border = "┌" + "─".repeat(48) + "┐";
    const bottom = "└" + "─".repeat(48) + "┘";
    const pad = (s: string) => {
      const line = "│ " + s;
      return line + " ".repeat(Math.max(0, 49 - line.length)) + " │";
    };
    console.log(border);
    console.log(pad(`🏷  ${agent.ensName}`));
    console.log(pad(`📍 ${agent.address ?? "unresolved"}`));
    for (const [key, val] of Object.entries(agent.textRecords)) {
      if (val) console.log(pad(`   ${key}: ${val}`));
    }
    if (agent.reputation) {
      const bar = "█".repeat(Math.round(agent.reputation.score / 5));
      const empty = "░".repeat(20 - Math.round(agent.reputation.score / 5));
      console.log(pad(`⭐ Score: ${agent.reputation.score}/100 [${bar}${empty}]`));
    }
    console.log(bottom);
    console.log();
  }

  // --- Reputation Comparison ---
  const scored = results.agents
    .filter((a) => a.reputation !== null)
    .sort((a, b) => (b.reputation?.score ?? 0) - (a.reputation?.score ?? 0));

  if (scored.length > 1) {
    console.log("=== Reputation Comparison ===\n");
    console.log("  Rank  Name               Score  Txs      Balance");
    console.log("  ────  ─────────────────  ─────  ───────  ──────────");
    scored.forEach((agent, idx) => {
      const rep = agent.reputation!;
      const txCount = (rep.factors as Record<string, unknown>).transactionCount ?? "?";
      const bal = ((rep.factors as Record<string, unknown>).balanceEth as number)?.toFixed(4) ?? "?";
      const name = agent.ensName.padEnd(17);
      const score = String(rep.score).padStart(3);
      console.log(`  #${idx + 1}    ${name}  ${score}    ${String(txCount).padStart(7)}  ${bal} ETH`);
    });
    console.log();
  }

  // --- Discovery Search Demonstration ---
  console.log("=== Agent Discovery Demo ===\n");
  const knownNames = listKnownAgentNames();
  console.log(`Registry contains ${knownNames.length} known agents:`);
  console.log(`  ${knownNames.join(", ")}\n`);

  console.log("Searching for agents with pattern 'eth'...");
  try {
    const discovered = await discoverAgents("eth", knownNames.slice(0, 3));
    if (discovered.length > 0) {
      console.log(`  Found ${discovered.length} matching agent(s):`);
      for (const d of discovered) {
        console.log(`    - ${d.name} (${d.agentType ?? "no type"})`);
      }
    } else {
      console.log("  No agents matched (agent.type record not set for queried names)");
    }
  } catch {
    console.log("  Discovery search skipped (requires live RPC)");
  }
  console.log();

  // Save results to proof/demo.json
  const proofDir = resolve(process.cwd(), "proof");
  mkdirSync(proofDir, { recursive: true });

  const outputPath = resolve(proofDir, "demo.json");
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${outputPath}`);
  console.log(`Known agent names: ${results.knownAgentNames.join(", ")}`);
}

runDemo().catch((err) => {
  console.error("Demo failed:", err);
  process.exit(1);
});
