# Contract V2 - Player Self-Deposit Integration

## 🔄 What Changed?

### Old Contract (V1)
```solidity
function playerDeposit(bytes32 _gameId, address _playerAddress)
    external payable onlyOwner
```
- **Owner** deposits on behalf of players
- Owner signs all transactions
- Owner pays all entry fees

### New Contract (V2) - **Currently Deployed**
```solidity
function playerDeposit(bytes32 _gameId)
    external payable
```
- **Each player** deposits for themselves
- Each player signs their own transaction
- Each player pays their own entry fee
- **This is the REAL GAME mode!**

---

## 🎯 Current Deployment

**Contract Address:** `0x39cECF23772596579276303a850cd641c3f152bA`
**Network:** U2U Testnet
**Contract Type:** V2 (Player Self-Deposit)

---

## 📁 Files

### New V2 Files:
- **`contractFunctions_v2.ts`** - Updated integration with correct ABI
- **`index_v2.ts`** - Test suite for player self-deposit

### Old V1 Files (won't work with deployed contract):
- ~~`contractFunctions.ts`~~ - Has old ABI, don't use
- ~~`index.ts`~~ - Uses old flow, don't use

---

## 🚀 How to Test V2 Contract

### Step 1: Get Test Player Private Keys

You need **4 test wallets** with private keys. Each player needs:
- Their own private key
- At least **1.1 U2U** (1 U2U entry fee + 0.1 U2U gas)

**Option A: Create New Test Wallets**

Use this script to generate test wallets:

```bash
npx ts-node -e "
const ethers = require('ethers');
for (let i = 1; i <= 4; i++) {
  const wallet = ethers.Wallet.createRandom();
  console.log(\`Player \${i}:\`);
  console.log(\`  Address: \${wallet.address}\`);
  console.log(\`  Private Key: \${wallet.privateKey}\`);
  console.log('');
}
"
```

**Option B: Use Existing Wallets**

If you have private keys for your test addresses:
- Winner: `0x6FdAa3B94bFbe5dc96C4F148c811f74138e92171`
- Runner Up 1: `0x085f18304660c3374c05cb479b3eC7c042ccC745`
- Runner Up 2: `0xbEff58504eB09E3Bb3edC68e81250c71D3f8c0f5`
- Loser: `0xc4236361E8dD2c1691225090e04e6E45fffbf412`

### Step 2: Add Private Keys to .env

```bash
# Player Private Keys for Testing
WINNER_PRIVATE_KEY=0x...
RUNNER_UP_1_PRIVATE_KEY=0x...
RUNNER_UP_2_PRIVATE_KEY=0x...
LOSER_PRIVATE_KEY=0x...

# Contract Configuration (already set)
PRIVATE_KEY=566d8ee2aee2691a37c8d39b6d3e2f412a1479f16e49e5ece71eae200781b195
CREATOR_WALLET=0xc4236361E8dD2c1691225090e04e6E45fffbf412
RPC_URL=https://rpc-nebulas-testnet.u2u.xyz
FINAL_CONTRACT_ADDRESS=0x39cECF23772596579276303a850cd641c3f152bA
```

### Step 3: Fund Test Wallets

Each of the 4 test wallets needs U2U tokens:
- Go to U2U Testnet Faucet
- Send 1.5 U2U to each test wallet address

### Step 4: Run Tests

```bash
npx ts-node src/contract/conmtractTest/index_v2.ts
```

---

## 📊 Expected Test Flow

```
🚀 Starting contract tests (V2 - Player Self-Deposit)...

📋 Contract Information:
   Contract Address: 0x39cECF23772596579276303a850cd641c3f152bA
   Owner:            0xc4236361E8dD2c1691225090e04e6E45fffbf412
   Creator Wallet:   0xc4236361E8dD2c1691225090e04e6E45fffbf412
   Entry Fee:        1000000000000000000 wei (1 U2U)

📝 Test 1: Player Deposits (4 Players - Each Signs Their Own)

[1/4] Winner depositing...
💰 Player 0x6FdA... depositing...
   📝 Transaction sent: 0x...
   ✅ Deposit successful! Block: 12345
   👥 Players in game: 1/4

[2/4] 1st Runner-up depositing...
💰 Player 0x085f... depositing...
   📝 Transaction sent: 0x...
   ✅ Deposit successful! Block: 12346
   👥 Players in game: 2/4

... (continues for all 4 players)

📊 Game Status After All Deposits:
   Game ID:          test-game-1234567890
   Players Count:    4/4
   Pool Amount:      4000000000000000000 wei (4 U2U)

📝 Test 2: Prize Distribution
🏆 Distributing prizes...
   ✅ Prizes distributed! Block: 12350

   📊 Distribution Summary:
   Winner:      2.0 U2U
   1st Runner:  1.0 U2U
   2nd Runner:  0.5 U2U
   Loser:       0.0 U2U
   💰 Creator:   0.5 U2U

✨ ALL TESTS COMPLETED SUCCESSFULLY!
```

---

## 🔍 How V2 Integration Works

### playerDeposit() - Player Signs Their Own Transaction

```typescript
// Old way (V1) - DON'T USE
await playerDeposit(gameId, playerAddress);  // Owner signs for player

// New way (V2) - USE THIS
await playerDeposit(gameId, playerPrivateKey);  // Player signs for themselves
```

**Code Flow:**
1. Create wallet from player's private key
2. Player wallet signs the transaction
3. Player sends 1 U2U with the transaction
4. Contract adds `msg.sender` (player's address) to game

### prizeWithdrawal() - Still Owner Only

```typescript
// Owner signs (same as before)
await prizeWithdrawal(gameId, [winner, runner1, runner2, loser]);
```

---

## ⚠️ Important Notes

### Entry Fee
- **1 U2U per player** (not 10 U2U!)
- Total pool: 4 U2U
- Check Line 28 in finalContractOptimized.sol: `uint256 public constant ENTRY_FEE = 1 ether;`

### Gas Costs
- Each deposit: ~0.01-0.05 U2U gas
- Prize distribution: ~0.05-0.1 U2U gas
- Total needed per player: ~1.1 U2U

### Transaction Signing
- **Deposits:** Each player uses their own wallet
- **Prize Distribution:** Owner wallet (from `PRIVATE_KEY` in .env)
- **Emergency Withdraw:** Owner wallet

### Security
- ✅ Players deposit for themselves (real game mode)
- ✅ Owner cannot steal funds
- ✅ Emergency withdraw refunds all players
- ✅ Reentrancy protected
- ✅ Multi-game isolation

---

## 🐛 Troubleshooting

### "missing revert data" error
**Problem:** Using old ABI (contractFunctions.ts) with new contract
**Solution:** Use `contractFunctions_v2.ts` instead

### "Player already deposited"
**Problem:** Already tested with this gameId
**Solution:** Restart test (it generates new gameId with timestamp)

### "Insufficient funds"
**Problem:** Test wallet doesn't have enough U2U
**Solution:** Send more U2U to test wallet addresses

### "Invalid private key"
**Problem:** Missing or wrong format private key
**Solution:** Check private keys in .env start with `0x` and are 64 hex chars

---

## 🎯 Integration with Real Game

For your monopoly game server, you'll need to:

1. **When player joins game:**
   - Get player's wallet address from frontend
   - Frontend holds player's private key (MetaMask/wallet)

2. **When game starts (4 players ready):**
   - Frontend calls `playerDeposit(gameId)` for each player
   - Each player signs their own transaction via MetaMask
   - Wait for all 4 deposits to complete

3. **When game ends:**
   - Backend calculates rankings
   - Owner calls `prizeWithdrawal(gameId, rankedPlayers)`
   - Prizes sent to all players automatically

---

## 📚 API Reference

### playerDeposit(gameId, playerPrivateKey)
**Description:** Player deposits entry fee for themselves
**Parameters:**
- `gameId`: string - Unique game identifier
- `playerPrivateKey`: string - Player's private key (starts with 0x)

**Returns:** DepositResult with transaction details

### prizeWithdrawal(gameId, rankedPlayers)
**Description:** Owner distributes prizes based on rankings
**Parameters:**
- `gameId`: string - Game identifier
- `rankedPlayers`: [string, string, string, string] - Addresses in rank order

**Returns:** PrizeWithdrawalResult with distribution details

### emergencyWithdraw(gameId)
**Description:** Owner refunds all players if game doesn't start
**Parameters:**
- `gameId`: string - Game identifier

**Returns:** EmergencyWithdrawResult with refund details

---

## ✅ Ready to Test!

1. Get 4 test wallets with private keys
2. Fund each with 1.5 U2U
3. Add private keys to `.env`
4. Run: `npx ts-node src/contract/conmtractTest/index_v2.ts`

🎉 Your contract is ready for the real game!
