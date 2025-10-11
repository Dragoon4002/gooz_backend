# 🚀 Hardhat Deployment - Quick Start

Hardhat is configured and ready! Your contract has been compiled successfully.

---

## ✅ Setup Complete

- ✅ Hardhat 2.x installed
- ✅ Contract compiled
- ✅ Deployment script ready
- ✅ Network configured (U2U Testnet)

---

## 📋 Files Created

```
server/
├── hardhat.config.js          # Hardhat configuration
├── scripts/
│   └── deploy.js              # Deployment script
├── contracts/
│   └── MonopolyGameEscrow.sol # Your contract
└── .env                        # Configuration (already exists)
```

---

## 🚀 Deploy to U2U Testnet

### **Step 1: Check Your Configuration**

Your `.env` should have:
```bash
PRIVATE_KEY=566d8ee2aee2691a37c8d39b6d3e2f412a1479f16e49e5ece71eae200781b195
CREATOR_WALLET=0xc4236361E8dD2c1691225090e04e6E45fffbf412
RPC_URL=https://rpc-nebulas-testnet.u2u.xyz
```

✅ All set!

### **Step 2: Deploy**

Run this command:
```bash
npx hardhat run scripts/deploy.js --network u2u_testnet
```

### **Step 3: Wait for Confirmation**

You'll see:
```
🚀 DEPLOYING MONOPOLY GAME ESCROW CONTRACT
================================================================================

📋 Deployment Configuration:
   Network: u2u_testnet
   Creator Wallet: 0xc4236361E8dD2c1691225090e04e6E45fffbf412

👤 Deployer Account:
   Address: 0x...
   Balance: X.XX U2U

⏳ Deploying MonopolyGameEscrow...
   📝 Transaction sent, waiting for confirmation...

================================================================================
✅ DEPLOYMENT SUCCESSFUL!
================================================================================

📍 Contract Address:
   0xYourNewContractAddress
```

### **Step 4: Update Your Files**

After deployment, update:

**1. .env file:**
```bash
FINAL_CONTRACT_ADDRESS=0xYourNewContractAddress
```

**2. contractFunctions.ts (line 506):**
```typescript
const CONTRACT_ADDRESS = "0xYourNewContractAddress";
```

### **Step 5: Test**

Run tests to verify:
```bash
npx ts-node src/contract/conmtractTest/index.ts
```

---

## 🔍 Other Useful Commands

### **Compile Contract**
```bash
npx hardhat compile
```

### **Clean Build Artifacts**
```bash
npx hardhat clean
```

### **Get Help**
```bash
npx hardhat help
```

### **Deploy to Mainnet (when ready)**
```bash
npx hardhat run scripts/deploy.js --network u2u_mainnet
```

---

## ⚠️ Important Notes

### Entry Fee
- Contract uses **1 ether** as entry fee
- On U2U: 1 U2U = entry fee
- Total pool per game: 4 U2U

### Gas Fees
- Deployment costs ~0.05-0.1 U2U
- Make sure deployer wallet has sufficient balance

### Creator Wallet
- Set in .env: `0xc4236361E8dD2c1691225090e04e6E45fffbf412`
- This wallet receives remaining funds after prizes
- Can be changed later by contract owner

### Contract Owner
- Owner = deployer address
- Has special permissions:
  - Call prizeWithdrawal()
  - Call emergencyWithdraw()
  - Transfer ownership

---

## 🐛 Troubleshooting

### "Insufficient funds"
**Problem:** Deployer wallet doesn't have enough U2U
**Solution:** Add more U2U tokens to your wallet

### "Invalid nonce"
**Problem:** Transaction nonce mismatch
**Solution:** Wait a few seconds and try again

### "Network not responding"
**Problem:** Cannot connect to RPC
**Solution:** Check RPC_URL in .env is correct

### "Creator wallet already deposited"
**Problem:** Using creator wallet as a player
**Solution:** Use different address for creator

---

## 📊 Contract Details

**Current Configuration:**
- **Entry Fee:** 1 U2U per player
- **Total Players:** 4
- **Prize Distribution:**
  - Winner: 2 U2U (2x entry fee)
  - 1st Runner: 1 U2U (1x entry fee)
  - 2nd Runner: 0.5 U2U (0.5x entry fee)
  - Loser: 0 U2U
  - Creator: ~0.5 U2U (remainder)

**Security Features:**
- ✅ Reentrancy protection
- ✅ Multi-game isolation
- ✅ Emergency refund mechanism
- ✅ Player self-deposit (real game mode)

---

## 🎯 Ready to Deploy!

Just run:
```bash
npx hardhat run scripts/deploy.js --network u2u_testnet
```

🚀 Good luck!
