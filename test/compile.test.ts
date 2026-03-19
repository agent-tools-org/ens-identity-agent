import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { resolve, join } from "node:path";
import { existsSync, rmSync, readFileSync } from "node:fs";
import { compileContract, type CompileOutput } from "../src/compile.js";

const projectRoot = resolve(import.meta.dirname ?? ".", "..");
const contractPath = join(
  projectRoot,
  "contracts",
  "AgentIdentityRegistry.sol",
);
const testOutputDir = join(projectRoot, "artifacts", "_test_output");

describe("compile", () => {
  let result: CompileOutput;

  beforeAll(() => {
    result = compileContract({ contractPath });
  });

  afterAll(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
  });

  it("should compile the contract and return ABI, bytecode, and name", () => {
    expect(result.contractName).toBe("AgentIdentityRegistry");
    expect(Array.isArray(result.abi)).toBe(true);
    expect(result.abi.length).toBeGreaterThan(0);
    expect(typeof result.bytecode).toBe("string");
    expect(result.bytecode.length).toBeGreaterThan(0);
  });

  it("should include expected functions in the ABI", () => {
    const fnNames = result.abi
      .filter((e: any) => e.type === "function")
      .map((e: any) => e.name);
    expect(fnNames).toContain("registerAgent");
    expect(fnNames).toContain("updateReputation");
    expect(fnNames).toContain("getAgent");
    expect(fnNames).toContain("getAgentCount");
    expect(fnNames).toContain("getAgentByAddress");
  });

  it("should include expected events in the ABI", () => {
    const eventNames = result.abi
      .filter((e: any) => e.type === "event")
      .map((e: any) => e.name);
    expect(eventNames).toContain("AgentRegistered");
    expect(eventNames).toContain("ReputationUpdated");
  });

  it("should write artifact to output directory when specified", () => {
    const out = compileContract({ contractPath, outputDir: testOutputDir });
    const artifactPath = join(testOutputDir, "AgentIdentityRegistry.json");
    expect(existsSync(artifactPath)).toBe(true);

    const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));
    expect(artifact.contractName).toBe("AgentIdentityRegistry");
    expect(artifact.abi).toEqual(out.abi);
    expect(artifact.bytecode).toBe(out.bytecode);
  });

  it("should throw for non-existent contract file", () => {
    expect(() =>
      compileContract({ contractPath: "/tmp/nonexistent.sol" }),
    ).toThrow("Contract file not found");
  });
});
