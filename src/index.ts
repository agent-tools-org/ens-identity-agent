import { resolveAddress, resolveName, getTextRecord } from "./ens/resolver.js";
import { buildAgentProfile, lookupAgent, verifyAgentIdentity } from "./agent/identity-agent.js";
import { reputationScore, calculateScoreFromFactors } from "./agent/reputation.js";
import { discoverAgents, listKnownAgentNames } from "./discovery/registry.js";

export {
  // ENS Resolution
  resolveAddress,
  resolveName,
  getTextRecord,
  // Agent Identity
  buildAgentProfile,
  lookupAgent,
  verifyAgentIdentity,
  // Reputation
  reputationScore,
  calculateScoreFromFactors,
  // Discovery
  discoverAgents,
  listKnownAgentNames,
};

async function main() {
  console.log("=== ENS Identity Agent ===\n");

  const testName = "vitalik.eth";
  console.log(`Looking up ${testName}...`);

  try {
    const profile = await buildAgentProfile(testName);
    console.log("\nAgent Profile:");
    console.log(`  Name:        ${profile.name}`);
    console.log(`  Address:     ${profile.address ?? "N/A"}`);
    console.log(`  Avatar:      ${profile.avatar ?? "N/A"}`);
    console.log(`  Description: ${profile.description ?? "N/A"}`);
    console.log(`  URL:         ${profile.url ?? "N/A"}`);

    if (profile.address) {
      console.log("\nCalculating reputation...");
      const recordCount = Object.values(profile.records).filter(Boolean).length;
      const rep = await reputationScore(profile.address, profile.name, recordCount);
      console.log(`  Score: ${rep.score}/100`);
      console.log("  Factors:", JSON.stringify(rep.factors, null, 2));
    }
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
  }

  console.log("\nKnown agent names:", listKnownAgentNames().join(", "));
}

// Run if executed directly
const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("index.ts") || process.argv[1].endsWith("index.js"));

if (isMain) {
  main().catch(console.error);
}
