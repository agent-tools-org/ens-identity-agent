import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { resolveAddress, getTextRecord } from "../src/ens/resolver.js";
import { buildAgentProfile } from "../src/agent/identity-agent.js";
import { reputationScore } from "../src/agent/reputation.js";
import { listKnownAgentNames } from "../src/discovery/registry.js";

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

  // Save results to proof/demo.json
  const proofDir = resolve(process.cwd(), "proof");
  mkdirSync(proofDir, { recursive: true });

  const outputPath = resolve(proofDir, "demo.json");
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${outputPath}`);
  console.log(`\nKnown agent names: ${results.knownAgentNames.join(", ")}`);
}

runDemo().catch((err) => {
  console.error("Demo failed:", err);
  process.exit(1);
});
