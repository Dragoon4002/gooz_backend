/**
 * QUICK STATUS CHECK
 * Run: npx tsx src/quick-check.ts
 */

import { ethers } from "ethers";
import { config } from "dotenv";
import { readFileSync } from "fs";

config();

const USE_TESTNET = process.env.USE_TESTNET === 'true';
const CONTRACT_ADDRESS = USE_TESTNET ? process.env.TESTNET_CONTRACT_ADDRESS : process.env.MAINNET_CONTRACT_ADDRESS;
const RPC_URL = USE_TESTNET ? process.env.TESTNET_RPC_URL : process.env.MAINNET_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function quickCheck() {
  console.log('\n🔍 QUICK STATUS CHECK\n');
  console.log('═'.repeat(60));

  // Check 1: Wallet Balance
  console.log('\n💰 SERVER WALLET STATUS:');
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    const balance = await provider.getBalance(wallet.address);
    const balanceInU2U = parseFloat(ethers.formatEther(balance));
    const gamesRemaining = Math.floor(balanceInU2U / 1.0);

    console.log(`   Address: ${wallet.address}`);
    console.log(`   Balance: ${balanceInU2U.toFixed(4)} U2U`);
    console.log(`   Games Remaining: ~${gamesRemaining} games`);

    if (balanceInU2U < 2) {
      console.log('   ⚠️  CRITICAL: Balance very low! Add funds immediately.');
    } else if (balanceInU2U < 5) {
      console.log('   ⚠️  WARNING: Balance getting low. Add funds soon.');
    } else {
      console.log('   ✅ Balance OK');
    }
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }

  // Check 2: Frontend Payment Status
  console.log('\n🌐 FRONTEND PAYMENT STATUS:');
  try {
    const frontendFile = readFileSync('../gooz/src/app/page.tsx', 'utf-8');
    const isCommentedOut = frontendFile.includes('// const depositResult = await depositToGame');

    if (isCommentedOut) {
      console.log('   ❌ Contract calls are COMMENTED OUT');
      console.log('   Players are NOT paying from their wallets');
    } else {
      console.log('   ✅ Contract calls are ENABLED');
      console.log('   Players pay from their wallets');
    }
  } catch (error: any) {
    console.log('   ⚠️  Could not check frontend file');
  }

  // Check 3: Backend Payment Status
  console.log('\n🖥️  BACKEND PAYMENT STATUS:');
  try {
    const backendFile = readFileSync('./src/boardLogic.ts', 'utf-8');
    const hasPlayerDeposit = backendFile.includes('await playerDeposit(gameId, playerId');

    if (hasPlayerDeposit) {
      console.log('   ✅ Backend calls playerDeposit()');
      console.log('   Server pays for players');
    } else {
      console.log('   ❌ Backend does NOT call playerDeposit()');
      console.log('   Server expects players to have paid');
    }
  } catch (error: any) {
    console.log('   ⚠️  Could not check backend file');
  }

  // Check 4: Error Handler Status
  console.log('\n🚨 ERROR HANDLER STATUS:');
  try {
    const contextFile = readFileSync('../gooz/src/context/GameContext.tsx', 'utf-8');
    const hasErrorHandler = contextFile.includes("case 'ERROR':");

    if (hasErrorHandler) {
      console.log('   ✅ Frontend handles ERROR messages');
    } else {
      console.log('   ❌ Frontend DOES NOT handle ERROR messages');
      console.log('   Users cannot see errors from backend!');
    }
  } catch (error: any) {
    console.log('   ⚠️  Could not check frontend file');
  }

  // Summary
  console.log('\n📋 SUMMARY:');
  console.log('═'.repeat(60));

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    const balance = await provider.getBalance(wallet.address);
    const balanceInU2U = parseFloat(ethers.formatEther(balance));

    const frontendFile = readFileSync('../gooz/src/app/page.tsx', 'utf-8');
    const isFrontendDisabled = frontendFile.includes('// const depositResult = await depositToGame');

    const backendFile = readFileSync('./src/boardLogic.ts', 'utf-8');
    const isBackendEnabled = backendFile.includes('await playerDeposit(gameId, playerId');

    const contextFile = readFileSync('../gooz/src/context/GameContext.tsx', 'utf-8');
    const hasErrorHandler = contextFile.includes("case 'ERROR':");

    console.log('\nCurrent Configuration:');
    if (isFrontendDisabled && isBackendEnabled) {
      console.log('   📌 MODE: Server pays for players (Option B)');
      console.log(`   💰 Balance: ${balanceInU2U.toFixed(4)} U2U (~${Math.floor(balanceInU2U)} games)`);
      if (balanceInU2U < 5) {
        console.log('   ⚠️  ACTION NEEDED: Add funds to wallet');
      }
    } else if (!isFrontendDisabled && !isBackendEnabled) {
      console.log('   📌 MODE: Players pay from wallets (Option A)');
      console.log('   ✅ Server does not need funds');
    } else {
      console.log('   ⚠️  MISMATCH: Frontend and backend not aligned!');
      console.log('   ❌ CRITICAL: This will cause errors');
    }

    if (!hasErrorHandler) {
      console.log('   ⚠️  CRITICAL: Frontend cannot show errors to users!');
      console.log('   📝 FIX: Add ERROR case handler in GameContext.tsx');
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('═'.repeat(60));

    const issues = [];
    if (!hasErrorHandler) {
      issues.push('1. Add ERROR handler in gooz/src/context/GameContext.tsx');
    }
    if (isFrontendDisabled && isBackendEnabled && balanceInU2U < 5) {
      issues.push('2. Add funds to server wallet (needs U2U)');
    }
    if (isFrontendDisabled && !isBackendEnabled) {
      issues.push('3. Backend should call playerDeposit() or frontend should be enabled');
    }
    if (!isFrontendDisabled && isBackendEnabled) {
      issues.push('4. Both frontend and backend are paying - choose one!');
    }

    if (issues.length === 0) {
      console.log('   ✅ No critical issues detected!');
    } else {
      console.log('   Issues to fix:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }

  } catch (error: any) {
    console.log('   ⚠️  Could not generate summary');
  }

  console.log('\n');
}

quickCheck().catch(console.error);
