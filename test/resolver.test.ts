import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock viem before importing modules
vi.mock("viem", async () => {
  const actual = await vi.importActual("viem");
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      getEnsAddress: vi.fn(),
      getEnsName: vi.fn(),
      getEnsText: vi.fn(),
      getEnsResolver: vi.fn(),
    })),
    http: vi.fn(() => ({})),
  };
});

import { createPublicClient } from "viem";
import {
  resolveAddress,
  resolveName,
  getTextRecord,
  getTextRecords,
  getContentHash,
} from "../src/ens/resolver.js";
import { resetClient } from "../src/config.js";

function getMockClient() {
  return (createPublicClient as ReturnType<typeof vi.fn>).mock.results[
    (createPublicClient as ReturnType<typeof vi.fn>).mock.results.length - 1
  ].value;
}

describe("resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetClient();
  });

  it("resolveAddress should return address for valid ENS name", async () => {
    resetClient();
    const addr = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
    // Get mock after reset so we get a fresh client
    const result = await resolveAddress("vitalik.eth").catch(() => null);
    // Since we can't easily set up the mock return before the call,
    // let's test the mock client setup
    const mock = getMockClient();
    mock.getEnsAddress.mockResolvedValue(addr);

    const address = await resolveAddress("vitalik.eth");
    expect(address).toBe(addr);
    expect(mock.getEnsAddress).toHaveBeenCalled();
  });

  it("resolveAddress should return null for non-existent name", async () => {
    resetClient();
    // Force a fresh client
    await resolveAddress("test.eth").catch(() => null);
    const mock = getMockClient();
    mock.getEnsAddress.mockResolvedValue(null);

    const address = await resolveAddress("nonexistent-name-xyz123.eth");
    expect(address).toBeNull();
  });

  it("resolveName should return name for valid address", async () => {
    resetClient();
    await resolveName("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045").catch(
      () => null,
    );
    const mock = getMockClient();
    mock.getEnsName.mockResolvedValue("vitalik.eth");

    const name = await resolveName(
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    );
    expect(name).toBe("vitalik.eth");
  });

  it("resolveName should return null for address without ENS", async () => {
    resetClient();
    await resolveName("0x0000000000000000000000000000000000000001").catch(
      () => null,
    );
    const mock = getMockClient();
    mock.getEnsName.mockResolvedValue(null);

    const name = await resolveName(
      "0x0000000000000000000000000000000000000001",
    );
    expect(name).toBeNull();
  });

  it("getTextRecord should return text record value", async () => {
    resetClient();
    await getTextRecord("vitalik.eth", "avatar").catch(() => null);
    const mock = getMockClient();
    mock.getEnsText.mockResolvedValue("https://example.com/avatar.png");

    const avatar = await getTextRecord("vitalik.eth", "avatar");
    expect(avatar).toBe("https://example.com/avatar.png");
  });

  it("getTextRecord should return null for missing record", async () => {
    resetClient();
    await getTextRecord("vitalik.eth", "nonexistent").catch(() => null);
    const mock = getMockClient();
    mock.getEnsText.mockResolvedValue(null);

    const value = await getTextRecord("vitalik.eth", "nonexistent");
    expect(value).toBeNull();
  });

  it("getTextRecords should return multiple records", async () => {
    resetClient();
    await getTextRecord("vitalik.eth", "avatar").catch(() => null);
    const mock = getMockClient();
    mock.getEnsText.mockImplementation(
      async ({ key }: { key: string }) => {
        const records: Record<string, string> = {
          avatar: "https://avatar.example.com",
          description: "Co-founder of Ethereum",
          url: "https://vitalik.eth.limo",
        };
        return records[key] ?? null;
      },
    );

    const records = await getTextRecords("vitalik.eth", [
      "avatar",
      "description",
      "url",
      "nonexistent",
    ]);
    expect(records["avatar"]).toBe("https://avatar.example.com");
    expect(records["description"]).toBe("Co-founder of Ethereum");
    expect(records["url"]).toBe("https://vitalik.eth.limo");
    expect(records["nonexistent"]).toBeNull();
  });
});
