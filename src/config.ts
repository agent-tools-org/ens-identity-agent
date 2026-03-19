import "dotenv/config";
import { createPublicClient, http, type PublicClient, type Chain } from "viem";
import { mainnet } from "viem/chains";

export const ENS_REGISTRY_ADDRESS =
  "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" as const;

export const ENS_PUBLIC_RESOLVER =
  "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63" as const;

export const DEFAULT_RPC_URL =
  process.env.ETH_RPC_URL || "https://eth.llamarpc.com";

export const config = {
  rpcUrl: DEFAULT_RPC_URL,
  chain: mainnet as Chain,
  ensRegistry: ENS_REGISTRY_ADDRESS,
  ensResolver: ENS_PUBLIC_RESOLVER,
} as const;

let _client: PublicClient | null = null;

export function getClient(rpcUrl?: string): PublicClient {
  if (_client && !rpcUrl) return _client;
  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl ?? config.rpcUrl),
  });
  if (!rpcUrl) _client = client;
  return client;
}

export function resetClient(): void {
  _client = null;
}
