import {
  getGameDetails,
  hasPlayerDeposited,
  getCreatorWallet,
  getOwner,
  getContractBalance,
  getEntryFee,
  gameIdToBytes32
} from "./contractFunctions";
import { ethers } from "ethers";
import { config } from "dotenv";

config();

const TEST_GAME_ID = "test-game-1760172882978"; // The failing game ID

// Get wallet addresses from .env
const RUNNER_UP_1 = process.env.RUNNER_UP_1 || '';
const WINNER = process.env.WINNER_KEY || '';
const RUNNER_UP_2 = process.env.RUNNER_UP_2 || '';
const LOSER = process.env.LOSSER_KEY || '';

// Get owner wallet to check balance
const RPC_URL = process.env.RPC_URL || "https://rpc-nebulas-testnet.u2u.xyz";
const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY;

async function debug() {
  console.log('\n🔍 DEBUGGING CONTRACT STATE');
  console.log('='.repeat(80) + '\n');

  try {
    // Check contract info
    console.log('📋 Contract Information:');
    console.log('-'.repeat(80));
    const owner = await getOwner();
    const creator = await getCreatorWallet();
    const entryFee = await getEntryFee();
    const contractBalance = await getContractBalance();

    console.log(`Owner:            ${owner}`);
    console.log(`Creator:          ${creator}`);
    console.log(`Entry Fee:        ${ethers.formatEther(entryFee)} U2U`);
    console.log(`Contract Balance: ${ethers.formatEther(contractBalance)} U2U`);
    console.log('');

    // Check owner wallet balance
    console.log('💰 Owner Wallet Balance:');
    console.log('-'.repeat(80));
    if (OWNER_PRIVATE_KEY) {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
      const balance = await provider.getBalance(ownerWallet.address);

      console.log(`Address: ${ownerWallet.address}`);
      console.log(`Balance: ${ethers.formatEther(balance)} U2U`);

      if (balance < ethers.parseEther("50")) {
        console.log(`⚠️  WARNING: Low balance! Need at least 50 U2U for deposits (40 U2U) + gas`);
      } else {
        console.log(`✅ Sufficient balance for tests`);
      }
    }
    console.log('');

    // Check game state
    console.log(`🎮 Game State for: ${TEST_GAME_ID}`);
    console.log('-'.repeat(80));
    console.log(`GameId (bytes32): ${gameIdToBytes32(TEST_GAME_ID)}`);

    try {
      const details = await getGameDetails(TEST_GAME_ID);
      console.log(`Players:          ${details.players.length}/4`);
      console.log(`Pool Amount:      ${ethers.formatEther(details.poolAmount)} U2U`);
      console.log(`Is Completed:     ${details.isCompleted}`);
      console.log(`Has Transferred:  ${details.hasTransferred}`);

      if (details.players.length > 0) {
        console.log('\nCurrent Players:');
        details.players.forEach((player, idx) => {
          console.log(`  ${idx + 1}. ${player}`);
        });
      }
    } catch (error) {
      console.log('Game not found or has no players yet');
    }
    console.log('');

    // Check each test player
    console.log('👥 Test Player Status:');
    console.log('-'.repeat(80));

    const players = [
      { name: 'Winner', address: WINNER },
      { name: '1st Runner', address: RUNNER_UP_1 },
      { name: '2nd Runner', address: RUNNER_UP_2 },
      { name: 'Loser', address: LOSER }
    ];

    for (const player of players) {
      const hasDeposited = await hasPlayerDeposited(TEST_GAME_ID, player.address);
      const status = hasDeposited ? '✅ DEPOSITED' : '❌ NOT DEPOSITED';
      console.log(`${player.name.padEnd(15)} ${player.address}  ${status}`);
    }
    console.log('');

    // Check for duplicate addresses
    console.log('🔎 Checking for Duplicate Addresses:');
    console.log('-'.repeat(80));
    const addresses = players.map(p => p.address.toLowerCase());
    const uniqueAddresses = new Set(addresses);

    if (addresses.length !== uniqueAddresses.size) {
      console.log('⚠️  WARNING: DUPLICATE ADDRESSES DETECTED!');
      const duplicates = addresses.filter((addr, idx) => addresses.indexOf(addr) !== idx);
      console.log('Duplicates:', duplicates);
    } else {
      console.log('✅ All addresses are unique');
    }
    console.log('');

    // Recommendations
    console.log('📝 Recommendations:');
    console.log('-'.repeat(80));

    if (OWNER_PRIVATE_KEY) {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
      const balance = await provider.getBalance(ownerWallet.address);

      if (balance < ethers.parseEther("50")) {
        console.log('1. ⚠️  Add more U2U to owner wallet (need 50+ U2U)');
      }
    }

    const hasDeposited = await hasPlayerDeposited(TEST_GAME_ID, WINNER);
    if (hasDeposited) {
      console.log('2. ℹ️  Game already has deposits. Use a NEW game ID for fresh test:');
      console.log(`   const TEST_GAME_ID = "test-game-${Date.now()}";`);
    }

    console.log('');

  } catch (error: any) {
    console.error('❌ Debug failed:', error.message);
  }
}

debug();
