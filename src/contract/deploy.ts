import { ethers } from "ethers";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

config();

/**
 * Deploy MonopolyGameEscrow contract to U2U Testnet
 *
 * Requirements:
 * 1. PRIVATE_KEY in .env (deployer wallet)
 * 2. CREATOR_WALLET in .env (receives game profits)
 * 3. RPC_URL in .env (U2U testnet RPC)
 */

async function deployContract() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 DEPLOYING MONOPOLY GAME ESCROW CONTRACT');
  console.log('='.repeat(80) + '\n');

  // ========== STEP 1: CHECK ENVIRONMENT ==========
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const CREATOR_WALLET = process.env.CREATOR_WALLET;
  const RPC_URL = process.env.RPC_URL || "https://rpc-nebulas-testnet.u2u.xyz";

  if (!PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY not found in .env');
    process.exit(1);
  }

  if (!CREATOR_WALLET) {
    console.error('❌ Error: CREATOR_WALLET not found in .env');
    console.error('   This wallet will receive remaining funds after prize distribution');
    process.exit(1);
  }

  if (!ethers.isAddress(CREATOR_WALLET)) {
    console.error('❌ Error: Invalid CREATOR_WALLET address');
    process.exit(1);
  }

  console.log('✅ Environment Variables:');
  console.log(`   RPC URL: ${RPC_URL}`);
  console.log(`   Creator Wallet: ${CREATOR_WALLET}`);
  console.log('');

  // ========== STEP 2: CONNECT TO NETWORK ==========
  console.log('🔗 Connecting to U2U Testnet...');
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const deployer = new ethers.Wallet(PRIVATE_KEY, provider);

  try {
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name || 'U2U Testnet'} (Chain ID: ${network.chainId})`);
  } catch (error) {
    console.error('❌ Failed to connect to network:', error);
    process.exit(1);
  }

  const deployerAddress = deployer.address;
  const balance = await provider.getBalance(deployerAddress);

  console.log('');
  console.log('👤 Deployer Account:');
  console.log(`   Address: ${deployerAddress}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} U2U`);

  if (balance < ethers.parseEther("0.1")) {
    console.error('');
    console.error('⚠️  WARNING: Low balance! You need at least 0.1 U2U for gas fees');
    console.error('   Get testnet tokens from U2U faucet');
    process.exit(1);
  }

  console.log('');

  // ========== STEP 3: LOAD CONTRACT SOURCE ==========
  console.log('📄 Loading contract source...');
  const contractPath = path.join(__dirname, 'finalContractOptimized.sol');

  if (!fs.existsSync(contractPath)) {
    console.error('❌ Contract file not found:', contractPath);
    process.exit(1);
  }

  const sourceCode = fs.readFileSync(contractPath, 'utf8');
  console.log('✅ Contract loaded: finalContractOptimized.sol');
  console.log('');

  // ========== STEP 4: COMPILE CONTRACT ==========
  console.log('⚙️  Compiling contract...');
  console.log('');
  console.log('⚠️  MANUAL COMPILATION REQUIRED:');
  console.log('');
  console.log('   Option 1 - Use Remix IDE:');
  console.log('   1. Go to https://remix.ethereum.org');
  console.log('   2. Create new file: MonopolyGameEscrow.sol');
  console.log('   3. Paste contract from: src/contract/finalContractOptimized.sol');
  console.log('   4. Compile with Solidity 0.8.0+');
  console.log('   5. Go to "Deploy & Run Transactions"');
  console.log('   6. Select "Injected Provider - MetaMask" (or use "Custom External HTTP Provider")');
  console.log('   7. Paste this creator wallet: ' + CREATOR_WALLET);
  console.log('   8. Click "Deploy"');
  console.log('');
  console.log('   Option 2 - Use Hardhat:');
  console.log('   1. Install hardhat: npm install --save-dev hardhat');
  console.log('   2. Run: npx hardhat init');
  console.log('   3. Copy contract to contracts/ folder');
  console.log('   4. Create deployment script (see below)');
  console.log('   5. Run: npx hardhat run scripts/deploy.ts --network u2u');
  console.log('');
  console.log('   Option 3 - Use solc (Command Line):');
  console.log('   1. Install solc: npm install -g solc');
  console.log('   2. Compile: solcjs --bin --abi finalContractOptimized.sol');
  console.log('   3. Use the generated ABI and bytecode with ethers.js');
  console.log('');

  console.log('📋 Deployment Parameters:');
  console.log('   Constructor argument:');
  console.log(`   _creatorWallet: ${CREATOR_WALLET}`);
  console.log('');

  console.log('💡 After deployment:');
  console.log('   1. Copy the contract address');
  console.log('   2. Update FINAL_CONTRACT_ADDRESS in .env');
  console.log('   3. Update CONTRACT_ADDRESS in src/contract/conmtractTest/contractFunctions.ts');
  console.log('   4. Run tests: npx ts-node src/contract/conmtractTest/index.ts');
  console.log('');

  console.log('='.repeat(80));
  console.log('⏸️  DEPLOYMENT PAUSED - AWAITING MANUAL COMPILATION');
  console.log('='.repeat(80));
  console.log('');
}

// Run deployment
deployContract().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});
