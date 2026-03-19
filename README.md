# ENS Identity Agent

ENS-powered identity, reputation, and discovery layer for AI agents. Hackathon submission for **"Best Use of ENS"**.

## ENS as Agent Identity

The Ethereum Name Service (ENS) is the natural identity layer for autonomous AI agents. Just as humans use usernames and domain names, agents need a decentralized, verifiable, and human-readable identity system. ENS provides exactly this.

**Why ENS for agents?**

- **Human-readable**: `trading-agent.eth` is far more memorable than `0xd8dA...6045`
- **Decentralized**: No single authority controls agent identities
- **Verifiable**: Anyone can verify an agent's identity on-chain via forward and reverse resolution
- **Extensible**: Text records allow agents to publish metadata, capabilities, and service endpoints
- **Composable**: ENS integrates with the entire Ethereum ecosystem — wallets, dApps, and other agents

**The paradigm shift**: Instead of centralized API keys or OAuth tokens, agents authenticate by proving control of their ENS name. This creates a permissionless identity layer where any agent can participate without gatekeepers.

An agent's ENS name becomes its portable identity across protocols. When `defi-analyst.eth` interacts with a lending protocol, a DEX, or another agent, all parties can verify its identity, check its reputation, and inspect its capabilities — all on-chain.

## Architecture

```
ENS Names → Agent Identity → Reputation System → Discovery Registry
```

### How It Works

1. **Resolution** — Forward (`name → address`) and reverse (`address → name`) lookups link ENS names to Ethereum addresses
2. **Text records** — Structured metadata (avatar, description, URL, social handles)
3. **Agent metadata** — Custom text records: `agent.type`, `agent.version`, `agent.capabilities`
4. **Content hashes** — Links to decentralized content (IPFS, Swarm)

### Reputation Scoring Methodology

On-chain reputation is calculated from five weighted factors using a deterministic formula:

| Factor | Weight | Scoring Function | Description |
|---|---|---|---|
| Transaction Count | 30% | Tiered: 0→0, <10→0.2, <50→0.4, <200→0.6, <1000→0.8, 1000+→1.0 | Outgoing transactions (nonce) |
| Account Age | 25% | Linear: `min(years / 7, 1.0)` | Estimated from activity heuristics |
| Balance | 20% | Tiered: 0→0, <0.01→0.1, <0.1→0.3, <1→0.5, <10→0.7, 10+→1.0 | ETH holdings |
| ENS Ownership | 15% | Binary: 0 or 1.0 | Whether the address owns an ENS name |
| ENS Records | 10% | Linear: `min(count / 5, 1.0)` | Number of populated text records |

**Formula**: `score = round(Σ factor_score × factor_weight)`, clamped to `[0, 100]`.

**Example — vitalik.eth profile walkthrough**:

```
Name:         vitalik.eth
Address:      0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
Avatar:       eip155:1/erc1155:0xb32979...
Description:  Co-founder of Ethereum
Twitter:      VitalikButerin
GitHub:       vbuterin

Reputation Score: 100/100
  Transaction Count (30%):  1.0 × 30 = 30   (1000+ txs)
  Account Age (25%):        1.0 × 25 = 25   (7+ years)
  Balance (20%):            1.0 × 20 = 20   (10+ ETH)
  ENS Ownership (15%):      1.0 × 15 = 15   (owns ENS)
  ENS Records (10%):        1.0 × 10 = 10   (5+ records)
```

### Agent Discovery Protocol

Agents register themselves by setting ENS text records — no centralized registry required. Discovery works through pattern matching on these records:

```typescript
// Find all DeFi-related agents by agent.type text record
const agents = await discoverAgents("defi");

// Find agents by any text record key with wildcard patterns
const agents = await discoverAgentsByRecord("com.twitter", "alice*");

// List all known agents in the registry
const names = listKnownAgentNames();
// → ["vitalik.eth", "nick.eth", "aave.eth", "uniswap.eth", ...]
```

**Pattern matching** supports:
- Wildcard `*` — matches any characters (`defi*` matches `defi-analyst`, `defi-trader`)
- Substring match — `defi` matches `my-defi-agent`
- Case-insensitive — `DeFi` matches `defi-analyst`

The discovery flow:
1. An agent sets `agent.type = "defi-analyst"` as an ENS text record
2. Other agents call `discoverAgents("defi")` to find matching agents
3. Full profiles are built from ENS records for each match
4. Callers can verify agent identity and check reputation scores

## Project Structure

```
src/
  config.ts               — Ethereum & ENS configuration
  index.ts                — Entry point & exports
  ens/
    resolver.ts           — ENS forward/reverse resolution & text records
  agent/
    identity-agent.ts     — Agent profile building & verification
    reputation.ts         — On-chain reputation scoring
  discovery/
    registry.ts           — Agent discovery by ENS records
test/                     — Vitest test suites (offline, mocked)
scripts/
  demo.ts                 — Live mainnet demo
proof/
  demo.json               — Demo output
```

## Setup

```bash
npm install
cp .env.example .env
```

## Usage

```bash
# Run tests
npm test

# Run live demo (queries Ethereum mainnet)
npm run demo

# Run agent lookup
npm start
```

## Programmatic Usage

```typescript
import { resolveAddress, getTextRecords } from "./src/ens/resolver.js";
import { buildAgentProfile } from "./src/agent/identity-agent.js";
import { reputationScore } from "./src/agent/reputation.js";
import { discoverAgents } from "./src/discovery/registry.js";

// Resolve an ENS name
const address = await resolveAddress("vitalik.eth");

// Build a full agent profile from ENS records
const profile = await buildAgentProfile("vitalik.eth");
console.log(profile.name, profile.address, profile.description);

// Calculate on-chain reputation
const rep = await reputationScore(address!, "vitalik.eth", 5);
console.log(`Score: ${rep.score}/100`);

// Discover agents by type
const defiAgents = await discoverAgents("defi");
```

## Key Dependencies

- **viem** — Ethereum client with ENS utilities
- **dotenv** — Environment configuration
- **vitest** — Test framework

## License

MIT
