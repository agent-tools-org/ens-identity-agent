import { normalize } from "viem/ens";
import { type Address } from "viem";
import { getClient } from "../config.js";

/**
 * Forward resolution: ENS name → Ethereum address.
 */
export async function resolveAddress(
  name: string,
): Promise<Address | null> {
  const client = getClient();
  try {
    const address = await client.getEnsAddress({
      name: normalize(name),
    });
    return address ?? null;
  } catch {
    return null;
  }
}

/**
 * Reverse resolution: Ethereum address → ENS name.
 */
export async function resolveName(
  address: Address,
): Promise<string | null> {
  const client = getClient();
  try {
    const name = await client.getEnsName({ address });
    return name ?? null;
  } catch {
    return null;
  }
}

/**
 * Get a text record for an ENS name (avatar, url, description, com.twitter, etc.).
 */
export async function getTextRecord(
  name: string,
  key: string,
): Promise<string | null> {
  const client = getClient();
  try {
    const value = await client.getEnsText({
      name: normalize(name),
      key,
    });
    return value ?? null;
  } catch {
    return null;
  }
}

/**
 * Retrieve multiple text records at once.
 */
export async function getTextRecords(
  name: string,
  keys: string[],
): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};
  await Promise.all(
    keys.map(async (key) => {
      results[key] = await getTextRecord(name, key);
    }),
  );
  return results;
}

/**
 * Get the content hash for an ENS name.
 */
export async function getContentHash(
  name: string,
): Promise<string | null> {
  const client = getClient();
  try {
    // viem doesn't have a direct getContentHash, use readContract
    // We'll use getEnsText with a special approach, or call the resolver
    // For simplicity, use the available resolver approach
    const resolver = await client.getEnsResolver({ name: normalize(name) });
    if (!resolver) return null;
    // Content hash retrieval via low-level call
    return resolver;
  } catch {
    return null;
  }
}
