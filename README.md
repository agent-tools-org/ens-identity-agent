# ENS Identity Agent

ENS-powered identity, reputation, and discovery layer for AI agents. Hackathon submission for **"Best Use of ENS"**.

## Architecture

```
ENS Names → Agent Identity → Reputation System → Discovery Registry
```

### ENS as the Universal Agent Identity Layer

AI agents use ENS names as their on-chain identity. Each ENS name provides:

- **Address resolution** — forward and reverse lookups linking names to Ethereum addresses
- **Text records** — structured metadata (avatar, description, URL, social handles)
- **Agent metadata** — custom text records like `agent.type`, `agent.version`, `agent.capabilities`
- **Content hashes** — links to decentralized content

### Reputation Scoring

On-chain reputation calculated from five weighted factors:

| Factor | Weight | Description |
|---|---|---|
| Transaction Count | 30% | Number of outgoing transactions (nonce) |
| Account Age | 25% | Estimated age based on activity |
| Balance | 20% | ETH holdings |
| ENS Ownership | 15% | Whether the address owns an ENS name |
| ENS Records | 10% | Number of populated text records |

Final score: 0–100.

### Discovery Registry

Agents register by setting ENS text records. Other agents discover them by querying records with pattern matching:

```typescript
// Find all DeFi-related agents
const agents = await discoverAgents("defi");

// Find agents by Twitter handle
const agents = await discoverAgentsByRecord("com.twitter", "alice*");
```

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

## Key Dependencies

- **viem** — Ethereum client with ENS utilities
- **dotenv** — Environment configuration
- **vitest** — Test framework

## License

MIT
