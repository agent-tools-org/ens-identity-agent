import { describe, it, expect } from "vitest";
import {
  config,
  ENS_REGISTRY_ADDRESS,
  ENS_PUBLIC_RESOLVER,
  DEFAULT_RPC_URL,
  getClient,
  resetClient,
} from "../src/config.js";

describe("config", () => {
  it("should have valid ENS registry address", () => {
    expect(ENS_REGISTRY_ADDRESS).toBe(
      "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    );
    expect(ENS_REGISTRY_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("should have valid ENS public resolver address", () => {
    expect(ENS_PUBLIC_RESOLVER).toBe(
      "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63",
    );
    expect(ENS_PUBLIC_RESOLVER).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("should have a default RPC URL", () => {
    expect(DEFAULT_RPC_URL).toBeTruthy();
    expect(typeof DEFAULT_RPC_URL).toBe("string");
  });

  it("should export a complete config object", () => {
    expect(config).toHaveProperty("rpcUrl");
    expect(config).toHaveProperty("chain");
    expect(config).toHaveProperty("ensRegistry");
    expect(config).toHaveProperty("ensResolver");
  });

  it("should create and cache a viem client", () => {
    resetClient();
    const client1 = getClient();
    const client2 = getClient();
    expect(client1).toBe(client2);
  });
});
