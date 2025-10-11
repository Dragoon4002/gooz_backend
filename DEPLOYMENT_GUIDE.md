# 🚀 MonopolyGameEscrow Deployment Guide

Complete guide to deploy your updated contract to U2U Testnet or Mainnet.

---

## 📋 Prerequisites

1. ✅ `.env` file configured:
```bash
PRIVATE_KEY=your_private_key_here
CREATOR_WALLET=0x085f18304660c3374c05cb479b3eC7c042ccC745
RPC_URL=https://rpc-nebulas-testnet.u2u.xyz
```

2. ✅ Deployer wallet has sufficient balance (minimum 0.5 U2U for gas)

3. ✅ Contract file: `src/contract/finalContractOptimized.sol`

---

## 🎯 Deployment Methods

Choose one of these methods:

---

## **Method 1: Remix IDE (Easiest - Recommended for Beginners)**

### Step 1: Open Remix
Go to https://remix.ethereum.org

### Step 2: Create Contract File
1. In File Explorer, create new file: `MonopolyGameEscrow.sol`
2. Copy contents from `src/contract/finalContractOptimized.sol`
3. Paste into Remix

### Step 3: Compile
1. Click "Solidity Compiler" tab (left sidebar)
2. Select compiler version: `0.8.0+` (any version 0.8.x works)
3. Click "Compile MonopolyGameEscrow.sol"
4. Wait for green checkmark ✅

### Step 4: Connect Wallet
1. Click "Deploy & Run Transactions" tab
2. In "Environment" dropdown, select:
   - **MetaMask**: "Injected Provider - MetaMask"
   - **Manual**: "Custom External HTTP Provider" → Enter: `https://rpc-nebulas-testnet.u2u.xyz`
3. Make sure MetaMask is connected to U2U Testnet:
   - Network Name: `U2U Testnet`
   - RPC URL: `https://rpc-nebulas-testnet.u2u.xyz`
   - Chain ID: `2484` (check U2U docs for correct ID)
   - Currency Symbol: `U2U`

### Step 5: Deploy
1. In "Contract" dropdown, select `MonopolyGameEscrow`
2. In "Deploy" section, paste your creator wallet:
   ```
   0x085f18304660c3374c05cb479b3eC7c042ccC745
   ```
3. Click **"Deploy"** (orange button)
4. Confirm transaction in MetaMask
5. Wait for confirmation

### Step 6: Copy Contract Address
1. Look in "Deployed Contracts" section (bottom)
2. Copy the contract address (starts with `0x...`)
3. Save it!

✅ **Deployment Complete!**

---

## **Method 2: Hardhat (Recommended for Production)**

### Step 1: Install Hardhat
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### Step 2: Initialize Hardhat
```bash
npx hardhat init
```
- Select: "Create a TypeScript project"
- Press Enter for all defaults

### Step 3: Configure Hardhat
Create/update `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    u2u_testnet: {
      url: process.env.RPC_URL || "https://rpc-nebulas-testnet.u2u.xyz",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 2484, // Check U2U docs for correct Chain ID
    },
    u2u_mainnet: {
      url: "https://rpc-mainnet.u2u.xyz", // Replace with actual mainnet RPC
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 39, // Check U2U docs for correct Chain ID
    },
  },
};

export default config;
```

### Step 4: Copy Contract
```bash
cp src/contract/finalContractOptimized.sol contracts/MonopolyGameEscrow.sol
```

### Step 5: Create Deployment Script
Create `scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const creatorWallet = process.env.CREATOR_WALLET;

  if (!creatorWallet) {
    throw new Error("CREATOR_WALLET not set in .env");
  }

  console.log("Deploying MonopolyGameEscrow...");
  console.log("Creator Wallet:", creatorWallet);

  const MonopolyGameEscrow = await ethers.getContractFactory("MonopolyGameEscrow");
  const contract = await MonopolyGameEscrow.deploy(creatorWallet);

  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("✅ MonopolyGameEscrow deployed to:", address);
  console.log("\n📝 Next steps:");
  console.log("1. Add to .env:");
  console.log(`   FINAL_CONTRACT_ADDRESS=${address}`);
  console.log("2. Update contractFunctions.ts with new address");
  console.log("3. Run tests: npx ts-node src/contract/conmtractTest/index.ts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Step 6: Deploy to Testnet
```bash
npx hardhat run scripts/deploy.ts --network u2u_testnet
```

### Step 7: Verify Contract (Optional)
If U2U has a block explorer with verification:
```bash
npx hardhat verify --network u2u_testnet <CONTRACT_ADDRESS> "<CREATOR_WALLET>"
```

✅ **Deployment Complete!**

---

## **Method 3: Manual with solc**

### Step 1: Install Solidity Compiler
```bash
npm install -g solc
```

### Step 2: Compile Contract
```bash
cd src/contract
solcjs --optimize --bin --abi finalContractOptimized.sol -o compiled/
```

### Step 3: Deploy with Ethers.js
Use the generated ABI and bytecode with your custom deployment script.

---

## 🔍 After Deployment

### 1. Update Environment Variables
Add to `.env`:
```bash
FINAL_CONTRACT_ADDRESS=0xYourNewContractAddress
```

### 2. Update Contract Functions
Edit `src/contract/conmtractTest/contractFunctions.ts` line 506:
```typescript
const CONTRACT_ADDRESS = "0xYourNewContractAddress";
```

### 3. Test the Deployment
Run the test suite:
```bash
npx ts-node src/contract/conmtractTest/index.ts
```

Expected output:
- ✅ 4 players deposit successfully
- ✅ Prize distribution works
- ✅ All funds accounted for

### 4. Verify Contract Details
```bash
npx ts-node src/contract/conmtractTest/debug.ts
```

---

## 🎯 Mainnet Deployment Checklist

Before deploying to mainnet:

- [ ] Contract audited by professional firm
- [ ] Testnet deployment successful
- [ ] All tests passing (100+ test runs)
- [ ] Entry fee appropriate for chain (currently 1 ETH)
- [ ] Creator wallet address verified
- [ ] Deployer wallet has sufficient funds
- [ ] Multi-sig wallet for owner (recommended)
- [ ] Emergency procedures documented
- [ ] Team trained on prizeWithdrawal() process

**For Mainnet:**
```bash
npx hardhat run scripts/deploy.ts --network u2u_mainnet
```

---

## ⚠️ Important Notes

### Entry Fee
- Currently hardcoded: **1 ether** (Line 28 in contract)
- On Ethereum: 1 ETH ≈ $3,000+ (expensive!)
- On U2U: Check current U2U price
- **Cannot be changed after deployment**

### Creator Wallet
- Receives remaining funds after prizes
- Typically ~25% of pool (1 ETH per game)
- Set during deployment, can be changed by owner later

### Contract Owner
- Owner = deployer address
- Can call prizeWithdrawal() and emergencyWithdraw()
- Can transfer ownership
- Cannot steal funds (security verified)

---

## 🐛 Troubleshooting

### "Insufficient funds for gas"
**Solution:** Add more U2U to deployer wallet

### "Invalid address" error
**Solution:** Check CREATOR_WALLET is valid Ethereum address (0x...)

### "Network not responding"
**Solution:** Check RPC_URL is correct for U2U testnet

### Deployment stuck
**Solution:** Check gas price, try increasing gas limit

### Contract not verifying
**Solution:** Ensure exact compiler version matches (0.8.x)

---

## 📚 Resources

- **U2U Testnet Faucet:** Get test tokens
- **U2U Block Explorer:** View transactions
- **Remix IDE:** https://remix.ethereum.org
- **Hardhat Docs:** https://hardhat.org

---

## 🎉 Success!

Once deployed:
1. Contract address saved ✅
2. Tests passing ✅
3. Ready to integrate with game server ✅

Your MonopolyGameEscrow contract is live! 🚀
