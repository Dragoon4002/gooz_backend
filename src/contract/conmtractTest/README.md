# Contract Test Suite

## 📋 Overview

This test suite validates the deployed **MonopolyGameEscrow** contract on U2U Testnet.

**Deployed Contract:** `0x15f5dd9fbf005c370545977FF7293E022C7F0231`

---

## 📁 Files

- **`contractFunctions.ts`** - Contract integration functions with full ABI
- **`index.ts`** - Test suite that validates all contract functionality
- **`README.md`** - This file

---

## 🚀 How to Run Tests

### 1. Prerequisites

Ensure your `.env` file has:

```bash
PRIVATE_KEY=your_owner_private_key
RUNNER_UP_1=0x085f18304660c3374c05cb479b3eC7c042ccC745
WINNER_KEY=0x6FdAa3B94bFbe5dc96C4F148c811f74138e92171
RUNNER_UP_2=0xbEff58504eB09E3Bb3edC68e81250c71D3f8c0f5
LOSSER_KEY=0xc4236361E8dD2c1691225090e04e6E45fffbf412
RPC_URL=https://rpc-nebulas-testnet.u2u.xyz
FINAL_CONTRACT_ADDRESS=0x15f5dd9fbf005c370545977FF7293E022C7F0231
```

### 2. Run Tests

```bash
npx ts-node src/contract/conmtractTest/index.ts
```

---

## 📊 What Gets Tested

### ✅ Test 1: Player Deposits (4 Players)

Tests depositing entry fees for all 4 players:
- Winner
- 1st Runner-up
- 2nd Runner-up
- Loser

**Expected:**
- Each deposit costs 10 U2U
- Contract tracks 4/4 players
- Game marked as "Full"

### ✅ Test 2: Prize Distribution

Distributes prizes based on rankings:
- **Winner:** 20 U2U (2x entry fee)
- **1st Runner:** 10 U2U (1x entry fee)
- **2nd Runner:** 5 U2U (0.5x entry fee)
- **Loser:** 0 U2U
- **Creator:** ~5 U2U (remainder)

**Expected:**
- All transfers succeed
- Game marked as "Completed"
- Remainder sent to creator wallet

---

## 📤 Expected Output

```
🚀 Starting contract tests...

📍 Contract: 0x15f5dd9fbf005c370545977FF7293E022C7F0231
📍 Network: U2U Testnet
📍 Test Game ID: test-game-1234567890

================================================================================
🧪 TESTING DEPLOYED CONTRACT
================================================================================

📋 Contract Information:
--------------------------------------------------------------------------------
   Contract Address: 0x15f5dd9fbf005c370545977FF7293E022C7F0231
   Owner:            0x...
   Creator Wallet:   0x...
   Entry Fee:        10000000000000000000 wei (10 U2U)
   Contract Balance: 0 wei

📝 Test 1: Player Deposits (4 Players)
--------------------------------------------------------------------------------

[1/4] Depositing for Winner
Address: 0x6FdAa3B94bFbe5dc96C4F148c811f74138e92171
💰 Depositing for player 0x6FdAa3B94bFbe5dc96C4F148c811f74138e92171...
   Game ID: test-game-1234567890
   Entry Fee: 10.0 U2U
   📝 Transaction sent: 0x...
   ⏳ Waiting for confirmation...
   ✅ Deposit successful! Block: 12345
   👥 Players in game: 1/4

✅ Success!
   Tx Hash: 0x...
   Block: 12345
   Players in game: 1/4
   ⏳ Waiting 3 seconds before next deposit...

... (repeats for all 4 players)

================================================================================
📊 Game Status After All Deposits:
--------------------------------------------------------------------------------
   Game ID:          test-game-1234567890
   Players Count:    4/4

   Players:
      1. 0x6FdAa3B94bFbe5dc96C4F148c811f74138e92171
         (Winner)
      2. 0x085f18304660c3374c05cb479b3eC7c042ccC745
         (1st Runner-up)
      3. 0xbEff58504eB09E3Bb3edC68e81250c71D3f8c0f5
         (2nd Runner-up)
      4. 0xc4236361E8dD2c1691225090e04e6E45fffbf412
         (Loser)

   Pool Amount:      40000000000000000000 wei (40 U2U)
   Is Completed:     false
   Has Transferred:  false

================================================================================
⏳ Waiting 5 seconds before prize distribution...
================================================================================

📝 Test 2: Prize Distribution
--------------------------------------------------------------------------------

💰 Prize Structure:
   • Winner:      20 U2U (2x Entry Fee)
   • 1st Runner:  10 U2U (1x Entry Fee)
   • 2nd Runner:   5 U2U (0.5x Entry Fee)
   • Loser:        0 U2U
   • Creator:     ~5 U2U (Remainder)

🏆 Distributing prizes for game test-game-1234567890...
   Winner:       0x6FdAa3B94bFbe5dc96C4F148c811f74138e92171
   1st Runner:   0x085f18304660c3374c05cb479b3eC7c042ccC745
   2nd Runner:   0xbEff58504eB09E3Bb3edC68e81250c71D3f8c0f5
   Loser:        0xc4236361E8dD2c1691225090e04e6E45fffbf412

   📝 Transaction sent: 0x...
   ⏳ Waiting for confirmation...
   ✅ Prizes distributed! Block: 12350

   📊 Distribution Summary:
   Winner:      20.0 U2U
   1st Runner:  10.0 U2U
   2nd Runner:  5.0 U2U
   Loser:       0.0 U2U
   💰 Creator:   5.0 U2U

================================================================================
✅ PRIZE DISTRIBUTION SUCCESSFUL!
================================================================================
   Transaction: 0x...
   Block: 12350

   📊 Actual Distribution:
   • Winner:      20000000000000000000 wei
   • 1st Runner:  10000000000000000000 wei
   • 2nd Runner:  5000000000000000000 wei
   • Loser:       0 wei
   • Creator:     5000000000000000000 wei

================================================================================
📊 Final Game State:
--------------------------------------------------------------------------------
   Players:          4/4
   Pool Amount:      40000000000000000000 wei
   Is Completed:     true ✅
   Has Transferred:  true ✅
   Contract Balance: 0 wei

================================================================================
✨ ALL TESTS COMPLETED SUCCESSFULLY!
================================================================================

📝 Test Summary:
   ✅ Contract deployed and verified
   ✅ 4 players deposited successfully
   ✅ Game marked as full
   ✅ Prizes distributed correctly
   ✅ Remainder sent to creator wallet
   ✅ Game marked as completed

🎉 Your contract is working perfectly!

✅ Test execution completed
```

---

## 🔧 Available Functions

All functions from `contractFunctions.ts`:

### Core Functions:
- `playerDeposit(gameId, playerAddress)` - Deposit entry fee
- `prizeWithdrawal(gameId, rankedPlayers)` - Distribute prizes
- `emergencyWithdraw(gameId)` - Emergency withdrawal

### View Functions:
- `getGameDetails(gameId)` - Get full game information
- `hasPlayerDeposited(gameId, playerAddress)` - Check if player deposited
- `getCreatorWallet()` - Get creator wallet address
- `getOwner()` - Get contract owner
- `getContractBalance()` - Get total contract balance
- `getEntryFee()` - Get entry fee (10 U2U)

### Admin Functions:
- `setCreatorWallet(newAddress)` - Update creator wallet (owner only)

---

## 🐛 Troubleshooting

### Error: "Contract not initialized"
**Solution:** Check that `PRIVATE_KEY` is set in `.env`

### Error: "Player already deposited"
**Solution:** Each test run creates a unique game ID. If testing manually, use a different gameId.

### Error: "Insufficient funds"
**Solution:** Ensure owner wallet has enough U2U for gas fees (each deposit + distribution ~0.01 U2U gas)

### Error: "Game not full"
**Solution:** Ensure all 4 players have deposited before calling `prizeWithdrawal()`

---

## 📝 Notes

- Each test run uses a unique game ID: `test-game-${timestamp}`
- Tests are non-destructive (creates new game each time)
- Owner wallet pays for all transactions
- Entry fee: **10 U2U per player** (40 U2U total)
- Gas cost: **~0.01 U2U per transaction**

---

## 🎯 Next Steps

After successful testing:

1. ✅ Contract verified working
2. Update `boardLogic.ts` to use deployed contract
3. Replace imports:
   ```typescript
   // OLD:
   import { playerDeposit, distributePrizes } from "./contract/contractFunction";

   // NEW:
   import { playerDeposit, prizeWithdrawal } from "./contract/conmtractTest/contractFunctions";
   ```
4. Test with real game flow
5. Deploy to production if needed

---

## 📚 Contract Details

- **Network:** U2U Testnet
- **Contract:** `0x15f5dd9fbf005c370545977FF7293E022C7F0231`
- **Entry Fee:** 10 U2U
- **Total Players:** 4
- **Prize Pool:** 40 U2U
- **Distribution:** 20 + 10 + 5 + 0 = 35 U2U (5 U2U to creator)

---

**✅ Contract is production-ready!**
