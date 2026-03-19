import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the resolver and identity-agent modules
vi.mock("../src/ens/resolver.js", () => ({
  resolveAddress: vi.fn(),
  resolveName: vi.fn(),
  getTextRecord: vi.fn(),
  getTextRecords: vi.fn(),
}));

vi.mock("../src/agent/identity-agent.js", () => ({
  buildAgentProfile: vi.fn(),
}));

import { getTextRecord } from "../src/ens/resolver.js";
import { buildAgentProfile } from "../src/agent/identity-agent.js";
import {
  listKnownAgentNames,
  discoverAgents,
  discoverAgentsByRecord,
  _matchesPattern,
} from "../src/discovery/registry.js";

const mockGetTextRecord = getTextRecord as ReturnType<typeof vi.fn>;
const mockBuildAgentProfile = buildAgentProfile as ReturnType<typeof vi.fn>;

describe("registry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listKnownAgentNames should return array of ENS names", () => {
    const names = listKnownAgentNames();
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n: string) => n.endsWith(".eth"))).toBe(true);
  });

  it("listKnownAgentNames should return a copy (not mutable reference)", () => {
    const names1 = listKnownAgentNames();
    const names2 = listKnownAgentNames();
    expect(names1).not.toBe(names2);
    expect(names1).toEqual(names2);
  });

  it("discoverAgents should find agents matching pattern", async () => {
    const candidates = ["agent1.eth", "agent2.eth", "agent3.eth"];

    mockGetTextRecord.mockImplementation(
      async (name: string, _key: string) => {
        const types: Record<string, string> = {
          "agent1.eth": "defi-analyst",
          "agent2.eth": "defi-trader",
          "agent3.eth": "nft-curator",
        };
        return types[name] ?? null;
      },
    );

    mockBuildAgentProfile.mockImplementation(async (name: string) => ({
      name,
      address: "0x1234",
      avatar: null,
      description: null,
      url: null,
      twitter: null,
      agentType: null,
      records: {},
    }));

    const agents = await discoverAgents("defi", candidates);
    expect(agents.length).toBe(2);
    expect(agents.map((a: { name: string }) => a.name).sort()).toEqual([
      "agent1.eth",
      "agent2.eth",
    ]);
  });

  it("discoverAgents should return empty array when no matches", async () => {
    mockGetTextRecord.mockResolvedValue(null);

    const agents = await discoverAgents("nonexistent", ["test.eth"]);
    expect(agents).toEqual([]);
  });

  it("matchesPattern should handle wildcard patterns", () => {
    expect(_matchesPattern("defi-analyst", "*")).toBe(true);
    expect(_matchesPattern("defi-analyst", "defi*")).toBe(true);
    expect(_matchesPattern("defi-analyst", "*analyst")).toBe(true);
    expect(_matchesPattern("defi-analyst", "defi")).toBe(true);
    expect(_matchesPattern("defi-analyst", "nft")).toBe(false);
  });

  it("matchesPattern should be case-insensitive", () => {
    expect(_matchesPattern("DeFi-Analyst", "defi")).toBe(true);
    expect(_matchesPattern("defi-analyst", "DEFI")).toBe(true);
  });

  it("discoverAgentsByRecord should search by custom key", async () => {
    const candidates = ["alice.eth", "bob.eth"];

    mockGetTextRecord.mockImplementation(
      async (name: string, key: string) => {
        if (key === "com.twitter" && name === "alice.eth") return "alice_ai";
        return null;
      },
    );

    mockBuildAgentProfile.mockImplementation(async (name: string) => ({
      name,
      address: "0x5678",
      avatar: null,
      description: null,
      url: null,
      twitter: null,
      agentType: null,
      records: {},
    }));

    const agents = await discoverAgentsByRecord(
      "com.twitter",
      "alice",
      candidates,
    );
    expect(agents.length).toBe(1);
    expect(agents[0].name).toBe("alice.eth");
  });
});
