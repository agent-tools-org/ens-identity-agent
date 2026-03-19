import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export interface CompileInput {
  contractPath: string;
  outputDir?: string;
}

export interface CompileOutput {
  abi: unknown[];
  bytecode: string;
  contractName: string;
}

/**
 * Compile a Solidity contract using solc.
 * Returns the ABI and bytecode for the first contract found.
 */
export function compileContract(input: CompileInput): CompileOutput {
  const { contractPath, outputDir } = input;
  const absolutePath = resolve(contractPath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Contract file not found: ${absolutePath}`);
  }

  const source = readFileSync(absolutePath, "utf-8");
  const fileName = absolutePath.split("/").pop()!;

  const solcInput = {
    language: "Solidity",
    sources: {
      [fileName]: { content: source },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"],
        },
      },
    },
  };

  const solc = require("solc");
  const compiled = JSON.parse(solc.compile(JSON.stringify(solcInput)));

  if (compiled.errors) {
    const errors = compiled.errors.filter(
      (e: { severity: string }) => e.severity === "error",
    );
    if (errors.length > 0) {
      const messages = errors.map(
        (e: { formattedMessage: string }) => e.formattedMessage,
      );
      throw new Error(`Compilation failed:\n${messages.join("\n")}`);
    }
  }

  const contracts = compiled.contracts[fileName];
  const contractName = Object.keys(contracts)[0];
  const contract = contracts[contractName];

  const abi = contract.abi as unknown[];
  const bytecode: string = contract.evm.bytecode.object;

  if (outputDir) {
    mkdirSync(outputDir, { recursive: true });
    const artifact = { contractName, abi, bytecode };
    writeFileSync(
      join(outputDir, `${contractName}.json`),
      JSON.stringify(artifact, null, 2),
    );
  }

  return { abi, bytecode, contractName };
}

// CLI entry point
const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("compile.ts") ||
    process.argv[1].endsWith("compile.js"));

if (isMain) {
  const projectRoot = resolve(import.meta.dirname ?? ".", "..");
  const contractPath = join(
    projectRoot,
    "contracts",
    "AgentIdentityRegistry.sol",
  );
  const outputDir = join(projectRoot, "artifacts");

  console.log(`Compiling ${contractPath}...`);
  const result = compileContract({ contractPath, outputDir });
  console.log(`Compiled ${result.contractName}`);
  console.log(`  ABI entries: ${result.abi.length}`);
  console.log(`  Bytecode length: ${result.bytecode.length} chars`);
  console.log(`  Output: ${outputDir}/${result.contractName}.json`);
}
