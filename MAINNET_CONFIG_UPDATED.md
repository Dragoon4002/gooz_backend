# ✅ Mainnet Configuration - UPDATED

## 🎯 **New Configuration (5 U2U Entry Fee)**

### **Updated: Entry Fee & Prize Structure**

---

## 💰 **Prize Structure (Per Game)**

```
Entry Fee per Player: 5 U2U
Total Pool (4 players): 20 U2U

Prize Distribution:
┌─────────────────┬──────────┬────────────┐
│ Position        │ Prize    │ Percentage │
├─────────────────┼──────────┼────────────┤
│ 1st (Winner)    │ 10 U2U   │ 50%        │
│ 2nd Runner-up   │ 5 U2U    │ 25%        │
│ 3rd Runner-up   │ 2.5 U2U  │ 12.5%      │
│ 4th (Loser)     │ 0 U2U    │ 0%         │
│ Creator Wallet  │ 2.5 U2U  │ 12.5%      │
└─────────────────┴──────────┴────────────┘
Total:              20 U2U     100%
```

---

## 🌐 **Network Configuration**

```bash
# U2U Mainnet (VERIFIED)
RPC_URL=https://rpc-mainnet.u2u.xyz
CHAIN_ID=39  # (0x27 in hexadecimal)
CURRENCY=U2U
BLOCK_EXPLORER=https://u2uscan.xyz  # Verify actual URL
```

---

## 📋 **Contract Changes Made**

### Smart Contract (`finalContractOptimized.sol`)
```solidity
// OLD (1 U2U):
uint256 public constant ENTRY_FEE = 1 ether;
uint256 private constant WINNER_PRIZE = 2 ether;
uint256 private constant FIRST_RUNNER_PRIZE = 1 ether;
uint256 private constant SECOND_RUNNER_PRIZE = 0.5 ether;
uint256 private constant TOTAL_POOL = 4 ether;

// NEW (5 U2U):
uint256 public constant ENTRY_FEE = 5 ether;           // 5 U2U
uint256 private constant WINNER_PRIZE = 10 ether;      // 10 U2U
uint256 private constant FIRST_RUNNER_PRIZE = 5 ether; // 5 U2U
uint256 private constant SECOND_RUNNER_PRIZE = 2.5 ether; // 2.5 U2U
uint256 private constant TOTAL_POOL = 20 ether;        // 20 U2U
```

✅ Updated in:
- `src/contract/finalContractOptimized.sol`
- `contracts/MonopolyGameEscrow.sol`

### Hardhat Config (`hardhat.config.js`)
```javascript
u2u_mainnet: {
  url: "https://rpc-mainnet.u2u.xyz",  // ✅ Verified
  chainId: 39,                          // ✅ Verified (0x27)
  gasPrice: "auto"
}
```

---

## 🚀 **Deployment Commands**

### **1. Compile Updated Contract**
```bash
npx hardhat clean
npx hardhat compile
```

### **2. Deploy to Mainnet**
```bash
# Make sure .env has mainnet configuration
npx hardhat run scripts/deploy.js --network u2u_mainnet
```

### **3. Verify Contract (After Deployment)**
```bash
npx hardhat verify --network u2u_mainnet <CONTRACT_ADDRESS> "<CREATOR_WALLET>"
```

---

## ⚙️ **Environment Variables (.env for Mainnet)**

```bash
# ============ MAINNET CONFIGURATION ============

# Network
RPC_URL=https://rpc-mainnet.u2u.xyz
CHAIN_ID=39

# Owner (use hardware wallet or multi-sig in production!)
PRIVATE_KEY=<YOUR_SECURE_OWNER_PRIVATE_KEY>

# Creator wallet (receives 2.5 U2U per game)
CREATOR_WALLET=<YOUR_CREATOR_WALLET_ADDRESS>

# Contract (fill after deployment)
FINAL_CONTRACT_ADDRESS=<DEPLOYED_CONTRACT_ADDRESS>

# ============ REMOVE THESE FOR MAINNET ============
# DO NOT include player private keys on mainnet!
# Players sign with their own wallets (MetaMask)
```

---

## 📊 **Economic Analysis**

### Revenue Per Game:
- **Total Pool:** 20 U2U (4 players × 5 U2U)
- **Creator Revenue:** 2.5 U2U per game (12.5%)

### Monthly Projections:
```
Games per Day  │ Daily Revenue │ Monthly Revenue
───────────────┼───────────────┼─────────────────
10 games       │ 25 U2U        │ 750 U2U
50 games       │ 125 U2U       │ 3,750 U2U
100 games      │ 250 U2U       │ 7,500 U2U
```

### Player Value:
- **Entry Cost:** 5 U2U per player
- **Winner Prize:** 10 U2U (2x return)
- **2nd Place:** 5 U2U (1x return, break even)
- **3rd Place:** 2.5 U2U (50% loss)
- **4th Place:** 0 U2U (100% loss)

---

## ⚠️ **IMPORTANT: Before Mainnet Deployment**

### ✅ Must Complete:

1. **Recompile with new entry fee**
   ```bash
   npx hardhat clean
   npx hardhat compile
   ```

2. **Test on testnet FIRST with 5 U2U**
   - Update testnet contract with 5 U2U entry fee
   - Run 10+ test games
   - Verify all calculations correct

3. **Security considerations for 5 U2U**
   - Higher stakes = higher risk
   - More valuable target for attackers
   - **Security audit even more important!**

4. **Update frontend**
   - Display: "Entry Fee: 5 U2U"
   - Show prize breakdown clearly
   - Update transaction value in UI

5. **Update documentation**
   - Terms of Service: 5 U2U entry fee
   - Help docs: Prize structure
   - FAQ: Cost to play

---

## 🔍 **Verification Checklist**

Before deploying to mainnet, verify:

- [ ] Contract compiled successfully
- [ ] Entry fee = 5 U2U (5000000000000000000 wei)
- [ ] Winner prize = 10 U2U
- [ ] Total pool = 20 U2U
- [ ] Hardhat config has mainnet RPC
- [ ] Chain ID = 39
- [ ] Creator wallet address correct
- [ ] Owner wallet secured (hardware/multi-sig)
- [ ] Tested on testnet with 5 U2U entry fee
- [ ] Frontend updated for 5 U2U
- [ ] Users informed of new price

---

## 📝 **Test Script (Testnet First!)**

```bash
# 1. Clean and compile
npx hardhat clean
npx hardhat compile

# 2. Deploy to TESTNET first
npx hardhat run scripts/deploy.js --network u2u_testnet

# 3. Test with 5 U2U entry fee
# Each player needs 5.5 U2U (5 for entry + 0.5 for gas)

# 4. Verify calculations
# - 4 players deposit: 20 U2U total
# - Winner gets: 10 U2U
# - 2nd gets: 5 U2U
# - 3rd gets: 2.5 U2U
# - 4th gets: 0 U2U
# - Creator gets: 2.5 U2U
# Total distributed: 20 U2U ✅

# 5. Only after successful testnet testing:
npx hardhat run scripts/deploy.js --network u2u_mainnet
```

---

## 💡 **Recommendations**

### Entry Fee Impact:

**Pros (5 U2U vs 1 U2U):**
- Higher revenue per game (2.5 U2U vs 0.5 U2U)
- Attracts more serious players
- Bigger prize pools more exciting

**Cons (5 U2U vs 1 U2U):**
- Higher barrier to entry
- May reduce player count
- Higher stakes = more scrutiny

### Consider:
- Start with 1 U2U to build user base
- Increase to 5 U2U after proving concept
- Or offer both: "Regular" (1 U2U) and "High Stakes" (5 U2U) games

---

## 🎯 **Current Status**

✅ **Contract updated:** Entry fee = 5 U2U
✅ **Hardhat configured:** Mainnet RPC + Chain ID
✅ **Prize structure:** 10 / 5 / 2.5 / 0 / 2.5 U2U
⚠️ **Not deployed yet** - Test on testnet first!
⚠️ **Security audit** - Highly recommended before mainnet

---

## 🚦 **Next Steps**

1. ✅ Compile updated contract
   ```bash
   npx hardhat compile
   ```

2. 🔄 Deploy to TESTNET with 5 U2U
   ```bash
   npx hardhat run scripts/deploy.js --network u2u_testnet
   ```

3. 🧪 Test thoroughly (10+ games with 5 U2U)

4. 🔒 Security audit (recommended)

5. 🚀 Deploy to mainnet
   ```bash
   npx hardhat run scripts/deploy.js --network u2u_mainnet
   ```

---

## 📞 **Questions to Consider**

1. **Is 5 U2U the right price?**
   - What's 5 U2U in USD currently?
   - Is this affordable for target users?

2. **Should you offer multiple tiers?**
   - Low stakes: 1 U2U
   - High stakes: 5 U2U
   - Requires deploying 2 contracts

3. **Dynamic pricing?**
   - Entry fee CANNOT change after deployment
   - Would need new contract to change price

---

## ✅ **Ready to Deploy When:**

- [x] Contract updated to 5 U2U ✅
- [x] Hardhat config correct ✅
- [ ] Tested on testnet with 5 U2U (pending)
- [ ] Security audit completed (recommended)
- [ ] Owner wallet secured (hardware/multi-sig)
- [ ] Frontend updated for 5 U2U
- [ ] Users notified of pricing
- [ ] Legal review completed
- [ ] Monitoring tools ready

---

**Updated:** $(date)
**Entry Fee:** 5 U2U per player
**Total Pool:** 20 U2U per game
**Creator Revenue:** 2.5 U2U per game (12.5%)
