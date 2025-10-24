# Eco-Token Exchange

A decentralized marketplace platform for environmental asset trading on the Stacks blockchain. Eco-Token Exchange provides infrastructure for issuing, managing, and exchanging verified environmental offset tokens with a robust multi-tier verification system.

## What is Eco-Token Exchange?

Eco-Token Exchange is a Clarity-based smart contract platform that enables organizations to create, certify, and trade environmental offset tokens. The protocol implements a three-tier governance model:
- **Administrators** manage the overall protocol
- **Authenticators** verify and credential environmental initiatives
- **Developers** issue and manage environmental asset tokens

## Features

- **Token Issuance**: Environmental developers mint verified offset tokens with comprehensive metadata
- **Verification Framework**: Multi-tier authentication ensures token legitimacy before trading
- **Marketplace Operations**: Peer-to-peer exchange with transparent pricing mechanisms
- **Consumption Records**: Permanent ledger of token retirement for impact tracking
- **Portfolio Management**: Complete balance tracking for holders across all token classes
- **Governance Controls**: Administrative overrides for protocol maintenance and emergency management

## System Architecture

The platform consists of three interconnected layers:

```
┌──────────────────────────────────────────┐
│         Governance Layer                 │
│  (Administrators & Authenticators)       │
└──────────────┬───────────────────────────┘
               │
┌──────────────▼───────────────────────────┐
│         Development Layer                │
│  (Token Creation & Registry)             │
└──────────────┬───────────────────────────┘
               │
┌──────────────▼───────────────────────────┐
│         Exchange Layer                   │
│  (Trading & Consumption)                 │
└──────────────────────────────────────────┘
```

### Core Data Models

**Environmental Tokens**
- Quantity (standardized units representing CO2e or equivalent)
- Scheme classification (renewable energy, forest conservation, etc.)
- Geographic identifier and certification framework
- Vintage year and unique credential number
- Consumption status and audit trail

**Marketplace Offers**
- Seller identification and rate specification
- Token quantity and unit pricing
- Activation status for dynamic management

**Account Ledgers**
- Available balance (trading inventory)
- Consumed balance (permanent offset record)
- Cross-token account tracking

## Getting Started

### Setup

Requirements:
- Clarinet 2.0+
- Node.js 18+
- Stacks blockchain wallet

### Installation

```bash
# Clone repository
git clone <repo-url>
cd eco-token-exchange

# Install dependencies
npm install

# Verify contract syntax
clarinet check
```

### Local Testing

```bash
# Run test suite
npm test

# Watch mode with live recompilation
npm run test:watch

# Generate test coverage report
npm run test:report
```

## Usage Examples

### As an Administrator

Initialize the protocol:
```clarity
;; Authorize a verification entity
(contract-call? .sustainable-asset-core enlist-authenticator 'ST1234567890ABCDEFGHIJ)
```

### As an Authenticator (Verifier)

Credential a developer:
```clarity
;; Approve an environmental initiative developer
(contract-call? .sustainable-asset-core approve-developer-entity 
  'SP0987654321JIHGFEDCBA
  "Amazon Reforestation Initiative 2024"
)
```

### As a Developer

Create marketplace listing:
```clarity
;; List tokens for exchange
(contract-call? .sustainable-asset-core publish-exchange-offer
  u42          ;; token ID
  u500         ;; quantity to offer
  u2500000     ;; price per unit (in microSTX)
)
```

## Contract Functions

### Administrative Interface
- `reassign-administrator(new-principal)` - Transfer protocol governance
- `enlist-authenticator(entity)` - Add verification authority
- `delist-authenticator(entity)` - Revoke verification authority

### Development Functions
- `approve-developer-entity(developer, label)` - Authenticate initiative
- `revoke-developer-access(developer)` - Disqualify developer

### Trading Functions
- `publish-exchange-offer(token-id, quantity, rate)` - Create sell order
- `withdraw-exchange-offer(offer-id)` - Cancel active listing

### Query Functions
- `fetch-token-record(token-id)` - Retrieve token metadata
- `fetch-offer-record(offer-id)` - Retrieve listing details
- `query-exchange-metrics()` - Protocol statistics

## Security Model

The protocol implements layered security:

1. **Access Control**: Three-tier permission hierarchy prevents unauthorized state modifications
2. **Balance Verification**: All transactions verified against current account state
3. **State Validation**: Token consumption marks permanent, irreversible consumption
4. **Audit Trail**: Complete transaction history for compliance and dispute resolution

## Development Roadmap

- Phase 1: Core token and marketplace functionality
- Phase 2: Automated price discovery mechanisms
- Phase 3: Cross-protocol interoperability
- Phase 4: Oracle integration for real-time verification

## Contributing

Contributions welcome. Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/enhancement`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push to branch (`git push origin feature/enhancement`)
5. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For questions, open an issue on GitHub or contact the development team.
