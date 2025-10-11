const hre = require("hardhat");
require("dotenv").config();

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 DEPLOYING MONOPOLY GAME ESCROW CONTRACT');
  console.log('='.repeat(80) + '\n');

  // Get creator wallet from environment
  const creatorWallet = process.env.CREATOR_WALLET;

  if (!creatorWallet) {
    throw new Error("❌ CREATOR_WALLET not set in .env file");
  }

  if (!hre.ethers.isAddress(creatorWallet)) {
    throw new Error("❌ Invalid CREATOR_WALLET address in .env file");
  }

  console.log('📋 Deployment Configuration:');
  console.log(`   Network: ${hre.network.name}`);
  console.log(`   Creator Wallet: ${creatorWallet}`);
  console.log('');

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);

  console.log('👤 Deployer Account:');
  console.log(`   Address: ${deployerAddress}`);
  console.log(`   Balance: ${hre.ethers.formatEther(balance)} U2U`);

  if (balance < hre.ethers.parseEther("0.1")) {
    console.warn('\n⚠️  WARNING: Low balance! You may not have enough for gas fees');
    console.warn('   Recommended: At least 0.1 U2U for deployment\n');
  }

  console.log('');
  console.log('⏳ Deploying MonopolyGameEscrow...');
  console.log('');

  // Deploy the contract
  const MonopolyGameEscrow = await hre.ethers.getContractFactory("MonopolyGameEscrow");
  const contract = await MonopolyGameEscrow.deploy(creatorWallet);

  console.log('   📝 Transaction sent, waiting for confirmation...');

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log('');
  console.log('='.repeat(80));
  console.log('✅ DEPLOYMENT SUCCESSFUL!');
  console.log('='.repeat(80));
  console.log('');
  console.log('📍 Contract Address:');
  console.log(`   ${contractAddress}`);
  console.log('');

  // Verify deployment
  console.log('🔍 Verifying deployment...');
  const owner = await contract.owner();
  const creatorFromContract = await contract.creatorWallet();
  const entryFee = await contract.ENTRY_FEE();

  console.log('');
  console.log('📊 Contract Details:');
  console.log(`   Owner: ${owner}`);
  console.log(`   Creator Wallet: ${creatorFromContract}`);
  console.log(`   Entry Fee: ${hre.ethers.formatEther(entryFee)} U2U`);
  console.log('');

  // Display next steps
  console.log('='.repeat(80));
  console.log('📝 NEXT STEPS:');
  console.log('='.repeat(80));
  console.log('');
  console.log('1. Update your .env file:');
  console.log(`   FINAL_CONTRACT_ADDRESS=${contractAddress}`);
  console.log('');
  console.log('2. Update contractFunctions.ts:');
  console.log('   File: src/contract/conmtractTest/contractFunctions.ts');
  console.log(`   Line 506: const CONTRACT_ADDRESS = "${contractAddress}";`);
  console.log('');
  console.log('3. Run tests:');
  console.log('   npx ts-node src/contract/conmtractTest/index.ts');
  console.log('');
  console.log('4. Verify contract (optional):');
  console.log(`   npx hardhat verify --network ${hre.network.name} ${contractAddress} "${creatorWallet}"`);
  console.log('');
  console.log('='.repeat(80));
  console.log('🎉 Deployment Complete!');
  console.log('='.repeat(80));
  console.log('');
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n' + '='.repeat(80));
    console.error('❌ DEPLOYMENT FAILED');
    console.error('='.repeat(80));
    console.error('');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    console.error('');
    process.exit(1);
  });
