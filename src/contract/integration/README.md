# Backend Integration - Player Self-Deposit Architecture

## 🏗️ Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │         │   Backend   │         │  Contract   │
│  (Player's  │         │   (Your     │         │  (Blockchain│
│   Wallet)   │         │   Server)   │         │   0x39cE...)│
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                        │
       │  1. Join Game         │                        │
       ├──────────────────────>│                        │
       │  (sends address)      │                        │
       │                       │                        │
       │  2. Tx Request        │                        │
       │<──────────────────────┤                        │
       │  {to, data, value}    │                        │
       │                       │                        │
       │  3. Sign & Send Tx    │                        │
       ├───────────────────────┼───────────────────────>│
       │  (MetaMask)           │                        │
       │                       │                        │
       │  4. Tx Hash           │                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │                       │  5. Confirm Deposit    │
       │                       ├───────────────────────>│
       │                       │                        │
       │                       │  6. Game Status        │
       │                       │<───────────────────────┤
       │                       │                        │
```

---

## ✅ What Backend Has

- ✅ Player wallet addresses (public keys)
- ✅ Owner's private key (for prize distribution)
- ✅ Contract ABI and address
- ✅ RPC connection to blockchain

## ❌ What Backend DOESN'T Need

- ❌ Player private keys
- ❌ Player signing capability
- ❌ Player funds

---

## 🔑 Contract Design (Perfect for This!)

```solidity
function playerDeposit(bytes32 _gameId) external payable {
    // Uses msg.sender - whoever signs becomes the player!
    game.players.push(msg.sender);
    game.hasDeposited[msg.sender] = true;
}
```

**Key Points:**
- No `_playerAddress` parameter needed
- No `onlyOwner` modifier
- Uses `msg.sender` automatically
- Player signs = Player deposits

---

## 🚀 Backend API Functions

### 1. `prepareDepositTransaction(gameId, playerAddress)`

**What it does:** Creates transaction data for player to sign

**Backend Input:**
```typescript
{
  gameId: "game-123",
  playerAddress: "0x6FdAa3B94bFbe5dc96C4F148c811f74138e92171"
}
```

**Backend Output (send to frontend):**
```typescript
{
  to: "0x39cECF23772596579276303a850cd641c3f152bA",
  data: "0x7c3c32a5...",  // Encoded function call
  value: "1000000000000000000",  // 1 U2U in wei
  chainId: 2484
}
```

**Frontend uses this to:**
```javascript
// Frontend code (not your concern)
const tx = await signer.sendTransaction(transactionRequest);
```

---

### 2. `confirmPlayerDeposit(gameId, playerAddress, txHash)`

**What it does:** Verifies deposit completed on blockchain

**Backend Input:**
```typescript
{
  gameId: "game-123",
  playerAddress: "0x6FdAa3B94bFbe5dc96C4F148c811f74138e92171",
  txHash: "0xabc123..."  // From frontend after signing
}
```

**Backend Output:**
```typescript
{
  confirmed: true,
  playerCount: 3,  // How many players deposited
  txHash: "0xabc123..."
}
```

---

### 3. `distributePrizes(gameId, rankedPlayers)`

**What it does:** Owner distributes prizes (backend signs this!)

**Backend Input:**
```typescript
{
  gameId: "game-123",
  rankedPlayers: [
    "0x6FdA...",  // Winner
    "0x085f...",  // 1st Runner
    "0xbEff...",  // 2nd Runner
    "0xc423..."   // Loser
  ]
}
```

**Backend Output:**
```typescript
{
  success: true,
  txHash: "0xdef456...",
  blockNumber: 12345
}
```

**NOTE:** Backend signs this with owner's private key!

---

## 📝 Complete Game Flow

### Phase 1: Game Lobby (Players Joining)

```typescript
// Player 1 joins
const player1Address = "0x6FdA..."; // From frontend

// Store in your database
game.players.push({
  address: player1Address,
  deposited: false
});
```

### Phase 2: Game Starts (All 4 Players Ready)

```typescript
// For each player:
for (const player of game.players) {
  // 1. Backend prepares transaction
  const txRequest = await prepareDepositTransaction(gameId, player.address);

  // 2. Send to frontend via WebSocket/HTTP
  sendToFrontend(player.socketId, {
    action: "SIGN_DEPOSIT",
    transaction: txRequest
  });

  // 3. Frontend signs and sends transaction
  // 4. Frontend sends back transaction hash

  // 5. Backend confirms
  const confirmation = await confirmPlayerDeposit(
    gameId,
    player.address,
    txHashFromFrontend
  );

  // 6. Update your database
  player.deposited = true;

  console.log(`Player deposited: ${confirmation.playerCount}/4`);
}
```

### Phase 3: Game Ends (Distribute Prizes)

```typescript
// Calculate rankings from game results
const rankedPlayers = [
  gameResult.winner,
  gameResult.runnerUp1,
  gameResult.runnerUp2,
  gameResult.loser
];

// Backend signs and distributes prizes
const result = await distributePrizes(gameId, rankedPlayers);

console.log(`Prizes distributed! Tx: ${result.txHash}`);

// Notify all players
broadcastToPlayers({
  action: "GAME_COMPLETED",
  txHash: result.txHash
});
```

---

## 🧪 Testing (With Private Keys)

For testing without a frontend, you can simulate signing:

### Add to .env:

```bash
# Player Addresses (Production - always needed)
WINNER_KEY=0x6FdAa3B94bFbe5dc96C4F148c811f74138e92171
RUNNER_UP_1=0x085f18304660c3374c05cb479b3eC7c042ccC745
RUNNER_UP_2=0xbEff58504eB09E3Bb3edC68e81250c71D3f8c0f5
LOSSER_KEY=0xc4236361E8dD2c1691225090e04e6E45fffbf412

# Player Private Keys (TESTING ONLY - remove in production)
WINNER_PRIVATE_KEY=0x...
RUNNER_UP_1_PRIVATE_KEY=0x...
RUNNER_UP_2_PRIVATE_KEY=0x...
LOSER_PRIVATE_KEY=0x...

# Owner (Always needed)
PRIVATE_KEY=566d8ee2aee2691a37c8d39b6d3e2f412a1479f16e49e5ece71eae200781b195
CREATOR_WALLET=0xc4236361E8dD2c1691225090e04e6E45fffbf412
```

### Run Test:

```bash
npx ts-node src/contract/integration/testBackend.ts
```

**This simulates:**
1. Backend preparing transactions
2. Frontend signing (simulated with private keys)
3. Backend confirming deposits
4. Backend distributing prizes

---

## 🔒 Security Notes

### Backend (Your Server)

**Has access to:**
- Owner's private key (for prize distribution only)
- Player addresses (public information)

**CANNOT:**
- Sign deposits for players
- Steal player funds
- Force players to deposit

### Frontend (Player's Browser)

**Has access to:**
- Player's wallet (MetaMask)
- Player's private key (stays in MetaMask, never exposed)

**Can:**
- Sign their own deposits
- Approve/reject transactions

### Contract (Blockchain)

**Ensures:**
- Only the signer becomes the player (`msg.sender`)
- Owner cannot deposit for others
- Deposits are non-refundable (except emergency withdraw)
- Prizes distributed correctly

---

## 📋 Production Checklist

### Before Going Live:

- [ ] Remove player private keys from .env
- [ ] Keep only player addresses in .env (or database)
- [ ] Ensure owner's private key is secure
- [ ] Test with real MetaMask signing
- [ ] Verify WebSocket/HTTP communication
- [ ] Test timeout scenarios (player doesn't sign)
- [ ] Test refund mechanism (emergency withdraw)
- [ ] Verify all 4 players must deposit before game starts
- [ ] Test prize distribution with owner's key

---

## 🎯 Quick Start

### 1. Install Dependencies

```bash
npm install ethers dotenv
```

### 2. Configure .env

```bash
# Required
FINAL_CONTRACT_ADDRESS=0x39cECF23772596579276303a850cd641c3f152bA
RPC_URL=https://rpc-nebulas-testnet.u2u.xyz
PRIVATE_KEY=566d8ee2aee2691a37c8d39b6d3e2f412a1479f16e49e5ece71eae200781b195
CREATOR_WALLET=0xc4236361E8dD2c1691225090e04e6E45fffbf412

# Player addresses (from frontend)
WINNER_KEY=0x6FdAa3B94bFbe5dc96C4F148c811f74138e92171
RUNNER_UP_1=0x085f18304660c3374c05cb479b3eC7c042ccC745
RUNNER_UP_2=0xbEff58504eB09E3Bb3edC68e81250c71D3f8c0f5
LOSSER_KEY=0xc4236361E8dD2c1691225090e04e6E45fffbf412

# For testing only (get from test wallets)
WINNER_PRIVATE_KEY=0x...
RUNNER_UP_1_PRIVATE_KEY=0x...
RUNNER_UP_2_PRIVATE_KEY=0x...
LOSER_PRIVATE_KEY=0x...
```

### 3. Run Test

```bash
npx ts-node src/contract/integration/testBackend.ts
```

### 4. Integrate with Your Server

```typescript
import {
  prepareDepositTransaction,
  confirmPlayerDeposit,
  distributePrizes,
  getGameDetails
} from "./contractBackend";

// Use in your game server logic
```

---

## 📚 Example Integration

### Express.js Example:

```typescript
import express from "express";
import { prepareDepositTransaction, confirmPlayerDeposit } from "./contractBackend";

const app = express();

// Endpoint: Request deposit transaction
app.post("/api/game/:gameId/deposit/prepare", async (req, res) => {
  const { gameId } = req.params;
  const { playerAddress } = req.body;

  try {
    const txRequest = await prepareDepositTransaction(gameId, playerAddress);
    res.json({ success: true, transaction: txRequest });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Endpoint: Confirm deposit
app.post("/api/game/:gameId/deposit/confirm", async (req, res) => {
  const { gameId } = req.params;
  const { playerAddress, txHash } = req.body;

  try {
    const confirmation = await confirmPlayerDeposit(gameId, playerAddress, txHash);
    res.json({ success: true, ...confirmation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
```

---

## ✅ Contract Verification

**Deployed Contract:** `0x39cECF23772596579276303a850cd641c3f152bA`
**Network:** U2U Testnet
**Entry Fee:** 1 U2U per player
**Total Pool:** 4 U2U

**Contract Features:**
- ✅ Players deposit for themselves (msg.sender)
- ✅ No owner control over deposits
- ✅ Emergency refund (owner refunds all players)
- ✅ Reentrancy protected
- ✅ Multi-game isolation

---

## 🎉 You're Ready!

Your backend integration is complete. The contract supports exactly what you need:
1. Backend prepares transactions
2. Frontend signs with player's wallet
3. Backend confirms and manages game state
4. Owner distributes prizes when game ends

**Test it now:**
```bash
npx ts-node src/contract/integration/testBackend.ts
```

Good luck! 🚀
