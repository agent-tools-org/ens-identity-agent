import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the resolver module
vi.mock("../src/ens/resolver.js", () => ({
  resolveAddress: vi.fn(),
  resolveName: vi.fn(),
  getTextRecord: vi.fn(),
  getTextRecords: vi.fn(),
}));

import {
  resolveAddress,
  resolveName,
  getTextRecords,
} from "../src/ens/resolver.js";
import {
  buildAgentProfile,
  lookupAgent,
  verifyAgentIdentity,
} from "../src/agent/identity-agent.js";

const mockResolveAddress = resolveAddress as ReturnType<typeof vi.fn>;
const mockResolveName = resolveName as ReturnType<typeof vi.fn>;
const mockGetTextRecords = getTextRecords as ReturnType<typeof vi.fn>;

describe("identity-agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buildAgentProfile should create a complete profile", async () => {
    const addr = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
    mockResolveAddress.mockResolvedValue(addr);
    mockGetTextRecords.mockResolvedValue({
      avatar: "https://avatar.example.com/v.png",
      description: "Ethereum co-founder",
      url: "https://vitalik.eth.limo",
      "com.twitter": "VitalikButerin",
      "com.github": "vbuterin",
      "agent.type": null,
      "agent.version": null,
      "agent.capabilities": null,
    });

    const profile = await buildAgentProfile("vitalik.eth");

    expect(profile.name).toBe("vitalik.eth");
    expect(profile.address).toBe(addr);
    expect(profile.avatar).toBe("https://avatar.example.com/v.png");
    expect(profile.description).toBe("Ethereum co-founder");
    expect(profile.url).toBe("https://vitalik.eth.limo");
    expect(profile.twitter).toBe("VitalikButerin");
  });

  it("lookupAgent should resolve by ENS name", async () => {
    const addr = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
    mockResolveAddress.mockResolvedValue(addr);
    mockGetTextRecords.mockResolvedValue({
      avatar: null,
      description: null,
      url: null,
      "com.twitter": null,
      "com.github": null,
      "agent.type": "researcher",
      "agent.version": null,
      "agent.capabilities": null,
    });

    const profile = await lookupAgent("vitalik.eth");
    expect(profile).not.toBeNull();
    expect(profile!.name).toBe("vitalik.eth");
    expect(profile!.agentType).toBe("researcher");
  });

  it("lookupAgent should resolve by address (reverse lookup)", async () => {
    const addr = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
    mockResolveName.mockResolvedValue("vitalik.eth");
    mockResolveAddress.mockResolvedValue(addr);
    mockGetTextRecords.mockResolvedValue({
      avatar: null,
      description: "Test",
      url: null,
      "com.twitter": null,
      "com.github": null,
      "agent.type": null,
      "agent.version": null,
      "agent.capabilities": null,
    });

    const profile = await lookupAgent(addr);
    expect(profile).not.toBeNull();
    expect(profile!.name).toBe("vitalik.eth");
  });

  it("lookupAgent should return null for unknown address", async () => {
    mockResolveName.mockResolvedValue(null);

    const profile = await lookupAgent(
      "0x0000000000000000000000000000000000000001",
    );
    expect(profile).toBeNull();
  });

  it("verifyAgentIdentity should return true for matching address", async () => {
    const addr = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
    mockResolveAddress.mockResolvedValue(addr);

    const result = await verifyAgentIdentity("vitalik.eth", addr as `0x${string}`);
    expect(result).toBe(true);
  });

  it("verifyAgentIdentity should return false for mismatched address", async () => {
    mockResolveAddress.mockResolvedValue(
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    );

    const result = await verifyAgentIdentity(
      "vitalik.eth",
      "0x0000000000000000000000000000000000000001",
    );
    expect(result).toBe(false);
  });

  it("verifyAgentIdentity should be case-insensitive", async () => {
    const addr = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
    mockResolveAddress.mockResolvedValue(addr);

    const result = await verifyAgentIdentity(
      "vitalik.eth",
      addr.toLowerCase() as `0x${string}`,
    );
    expect(result).toBe(true);
  });
});
