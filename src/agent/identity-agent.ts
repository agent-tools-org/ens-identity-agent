import { type Address } from "viem";
import { resolveAddress, resolveName, getTextRecords } from "../ens/resolver.js";

export interface AgentProfile {
  name: string;
  address: Address | null;
  avatar: string | null;
  description: string | null;
  url: string | null;
  twitter: string | null;
  agentType: string | null;
  records: Record<string, string | null>;
}

const DEFAULT_TEXT_KEYS = [
  "avatar",
  "description",
  "url",
  "com.twitter",
  "com.github",
  "agent.type",
  "agent.version",
  "agent.capabilities",
];

/**
 * Build a full agent profile from an ENS name.
 */
export async function buildAgentProfile(
  ensName: string,
): Promise<AgentProfile> {
  const [address, records] = await Promise.all([
    resolveAddress(ensName),
    getTextRecords(ensName, DEFAULT_TEXT_KEYS),
  ]);

  return {
    name: ensName,
    address,
    avatar: records["avatar"] ?? null,
    description: records["description"] ?? null,
    url: records["url"] ?? null,
    twitter: records["com.twitter"] ?? null,
    agentType: records["agent.type"] ?? null,
    records,
  };
}

/**
 * Lookup an agent by ENS name or Ethereum address.
 */
export async function lookupAgent(
  nameOrAddress: string,
): Promise<AgentProfile | null> {
  // Check if input looks like an address
  if (nameOrAddress.startsWith("0x") && nameOrAddress.length === 42) {
    const name = await resolveName(nameOrAddress as Address);
    if (!name) return null;
    return buildAgentProfile(name);
  }

  // Treat as ENS name
  return buildAgentProfile(nameOrAddress);
}

/**
 * Verify that an ENS name resolves to the claimed address.
 */
export async function verifyAgentIdentity(
  ensName: string,
  claimedAddress: Address,
): Promise<boolean> {
  const resolved = await resolveAddress(ensName);
  if (!resolved) return false;
  return resolved.toLowerCase() === claimedAddress.toLowerCase();
}
