import { getTextRecord } from "../ens/resolver.js";
import { buildAgentProfile, type AgentProfile } from "../agent/identity-agent.js";

/**
 * Known agent ENS names for demo/discovery purposes.
 * In production, this would be backed by an on-chain registry or indexer.
 */
const KNOWN_AGENT_NAMES: string[] = [
  "vitalik.eth",
  "nick.eth",
  "brantly.eth",
  "rainbowwallet.eth",
  "firefly.eth",
  "aave.eth",
  "uniswap.eth",
  "ens.eth",
];

/**
 * Return the hardcoded list of known agent ENS names.
 */
export function listKnownAgentNames(): string[] {
  return [...KNOWN_AGENT_NAMES];
}

/**
 * Discover agents whose "agent.type" text record matches a pattern.
 * Checks known agent names and returns matching profiles.
 */
export async function discoverAgents(
  pattern: string,
  candidateNames?: string[],
): Promise<AgentProfile[]> {
  const names = candidateNames ?? KNOWN_AGENT_NAMES;
  const results: AgentProfile[] = [];

  await Promise.all(
    names.map(async (name) => {
      try {
        const agentType = await getTextRecord(name, "agent.type");
        if (agentType && matchesPattern(agentType, pattern)) {
          const profile = await buildAgentProfile(name);
          results.push(profile);
        }
      } catch {
        // Skip names that fail to resolve
      }
    }),
  );

  return results;
}

/**
 * Discover agents by any text record key matching a pattern.
 */
export async function discoverAgentsByRecord(
  key: string,
  pattern: string,
  candidateNames?: string[],
): Promise<AgentProfile[]> {
  const names = candidateNames ?? KNOWN_AGENT_NAMES;
  const results: AgentProfile[] = [];

  await Promise.all(
    names.map(async (name) => {
      try {
        const value = await getTextRecord(name, key);
        if (value && matchesPattern(value, pattern)) {
          const profile = await buildAgentProfile(name);
          results.push(profile);
        }
      } catch {
        // Skip names that fail to resolve
      }
    }),
  );

  return results;
}

/**
 * Simple pattern matching: supports * wildcards and case-insensitive comparison.
 */
function matchesPattern(value: string, pattern: string): boolean {
  if (pattern === "*") return true;

  const lowerValue = value.toLowerCase();
  const lowerPattern = pattern.toLowerCase();

  if (!lowerPattern.includes("*")) {
    return lowerValue.includes(lowerPattern);
  }

  // Convert wildcard pattern to regex
  const regexStr = lowerPattern
    .split("*")
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");

  return new RegExp(`^${regexStr}$`).test(lowerValue);
}

// Export for testing
export { matchesPattern as _matchesPattern };
