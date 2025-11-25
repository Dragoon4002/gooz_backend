/**
 * DIAGNOSTIC SCRIPT - Run this to identify contract connection issues
 *
 * Usage: npx tsx src/diagnostic.ts
 */

import { ethers } from "ethers";
import { config } from "dotenv";

config();

const USE_TESTNET = process.env.USE_TESTNET === 'true';
const CONTRACT_ADDRESS = USE_TESTNET
  ? process.env.TESTNET_CONTRACT_ADDRESS
  : process.env.MAINNET_CONTRACT_ADDRESS;
const RPC_URL = USE_TESTNET
  ? process.env.TESTNET_RPC_URL
  : process.env.MAINNET_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const CONTRACT_ABI = [
  "function ENTRY_FEE() external view returns (uint256)",
  "function TOTAL_PLAYERS() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function getContractBalance() external view returns (uint256)",
];

async function runDiagnostics() {
  console.log('\n🔍 CONTRACT CONNECTION DIAGNOSTIC\n');
  console.log('='.repeat(60));

  // Step 1: Check Environment Variables
  console.log('\n📋 STEP 1: Environment Variables');
  console.log('-'.repeat(60));

  const checks = {
    'USE_TESTNET': USE_TESTNET,
    'TESTNET_RPC_URL': !!process.env.TESTNET_RPC_URL,
    'TESTNET_CONTRACT_ADDRESS': !!process.env.TESTNET_CONTRACT_ADDRESS,
    'MAINNET_RPC_URL': !!process.env.MAINNET_RPC_URL,
    'MAINNET_CONTRACT_ADDRESS': !!process.env.MAINNET_CONTRACT_ADDRESS,
    'PRIVATE_KEY': !!PRIVATE_KEY
  };

  let envChecksPassed = true;
  for (const [key, value] of Object.entries(checks)) {
    const status = value ? '✅' : '❌';
    console.log(`${status} ${key}: ${value || 'NOT SET'}`);
    if (!value && (key.includes('TESTNET') && USE_TESTNET || key.includes('MAINNET') && !USE_TESTNET || key === 'PRIVATE_KEY')) {
      envChecksPassed = false;
    }
  }

  console.log(`\n🌐 Active Network: ${USE_TESTNET ? 'TESTNET' : 'MAINNET'}`);
  console.log(`📍 Contract Address: ${CONTRACT_ADDRESS || 'NOT SET'}`);
  console.log(`🌐 RPC URL: ${RPC_URL || 'NOT SET'}`);

  if (!envChecksPassed) {
    console.log('\n❌ FAILED: Missing required environment variables');
    console.log('   Fix: Check your .env file\n');
    process.exit(1);
  }

  // Step 2: Test RPC Connection
  console.log('\n🌐 STEP 2: RPC Connection Test');
  console.log('-'.repeat(60));

  let provider: ethers.JsonRpcProvider;
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log('✅ Provider created');

    const network = await provider.getNetwork();
    console.log(`✅ Connected to network - Chain ID: ${network.chainId}`);

    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Latest block: ${blockNumber}`);

  } catch (error: any) {
    console.log(`❌ FAILED: ${error.message}`);
    console.log('\n🔧 POSSIBLE FIXES:');
    console.log('   1. Check if RPC_URL is correct');
    console.log('   2. Check your internet connection');
    console.log('   3. Try a different RPC endpoint\n');
    process.exit(1);
  }

  // Step 3: Test Wallet
  console.log('\n👛 STEP 3: Wallet Test');
  console.log('-'.repeat(60));

  let wallet: ethers.Wallet;
  try {
    wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    console.log(`✅ Wallet created: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    const balanceInU2U = ethers.formatEther(balance);
    console.log(`💰 Balance: ${balanceInU2U} U2U`);

    if (balance === 0n) {
      console.log('⚠️  WARNING: Wallet has 0 balance');
      console.log('   You need U2U to pay for gas fees');
    }

  } catch (error: any) {
    console.log(`❌ FAILED: ${error.message}`);
    console.log('\n🔧 POSSIBLE FIXES:');
    console.log('   1. Check if PRIVATE_KEY is valid');
    console.log('   2. Private key should be 64 hex characters (without 0x prefix)\n');
    process.exit(1);
  }

  // Step 4: Test Contract Connection
  console.log('\n📜 STEP 4: Contract Connection Test');
  console.log('-'.repeat(60));

  let contract: ethers.Contract;
  try {
    contract = new ethers.Contract(CONTRACT_ADDRESS!, CONTRACT_ABI, wallet);
    console.log('✅ Contract instance created');

    // Test view function calls
    const entryFee = await contract.ENTRY_FEE();
    console.log(`✅ Entry Fee: ${ethers.formatEther(entryFee)} U2U`);

    const totalPlayers = await contract.TOTAL_PLAYERS();
    console.log(`✅ Total Players: ${totalPlayers.toString()}`);

    const owner = await contract.owner();
    console.log(`✅ Contract Owner: ${owner}`);

    const contractBalance = await contract.getContractBalance();
    console.log(`💰 Contract Balance: ${ethers.formatEther(contractBalance)} U2U`);

  } catch (error: any) {
    console.log(`❌ FAILED: ${error.message}`);
    console.log('\n🔧 POSSIBLE FIXES:');
    console.log('   1. Contract may not be deployed at this address');
    console.log('   2. Contract ABI may not match deployed contract');
    console.log('   3. Contract address may be wrong');
    console.log(`\n   Current Address: ${CONTRACT_ADDRESS}`);
    console.log(`   Network: ${USE_TESTNET ? 'TESTNET' : 'MAINNET'}\n`);
    process.exit(1);
  }

  // Step 5: Test Timing (Race Condition Check)
  console.log('\n⏱️  STEP 5: Initialization Timing Test');
  console.log('-'.repeat(60));

  const timingTests = [];
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    try {
      const testProvider = new ethers.JsonRpcProvider(RPC_URL);
      const testWallet = new ethers.Wallet(PRIVATE_KEY!, testProvider);
      const testContract = new ethers.Contract(CONTRACT_ADDRESS!, CONTRACT_ABI, testWallet);
      await testContract.ENTRY_FEE();
      const duration = Date.now() - start;
      timingTests.push(duration);
      console.log(`✅ Test ${i + 1}: ${duration}ms`);
    } catch (error: any) {
      console.log(`❌ Test ${i + 1}: FAILED`);
    }
  }

  const avgTime = timingTests.reduce((a, b) => a + b, 0) / timingTests.length;
  console.log(`\n📊 Average initialization time: ${avgTime.toFixed(0)}ms`);

  if (avgTime > 500) {
    console.log('⚠️  WARNING: Initialization takes longer than 500ms');
    console.log('   This can cause race conditions on server startup');
    console.log('   FIX: Add await before starting WebSocket server');
  }

  // Success Summary
  console.log('\n✅ ALL DIAGNOSTICS PASSED!');
  console.log('='.repeat(60));
  console.log('\n📝 SUMMARY:');
  console.log(`   Network: ${USE_TESTNET ? 'TESTNET ✅' : 'MAINNET ⚠️'}`);
  console.log(`   Wallet: ${wallet!.address}`);
  console.log(`   Contract: ${CONTRACT_ADDRESS}`);
  console.log(`   Avg Init Time: ${avgTime.toFixed(0)}ms`);
  console.log('\n🎯 NEXT STEPS:');
  console.log('   1. If you see errors during gameplay:');
  console.log('      - Check server logs for specific error messages');
  console.log('      - Look for "Contract not initialized" errors');
  console.log('   2. If contract calls fail randomly:');
  console.log('      - Network timeout issue - add retry logic');
  console.log('   3. If prize distribution fails silently:');
  console.log('      - Check boardLogic.ts:665 - it returns null on error');
  console.log('\n');
}

runDiagnostics().catch((error) => {
  console.error('\n💥 UNEXPECTED ERROR:', error);
  process.exit(1);
});
