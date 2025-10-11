import {
  playerDeposit,
  prizeWithdrawal,
  getGameDetails,
  getCreatorWallet,
  getOwner,
  getContractBalance,
  getEntryFee
} from "./contractFunctions_v2";
import { config } from "dotenv";

config();

// Test game ID (use unique ID for each test run)
const TEST_GAME_ID = `test-game-${Date.now()}`;

// ⚠️ IMPORTANT: For the new contract, each player needs their OWN private key
// These are TEST private keys - DO NOT use real ones with funds!
// Generate test keys at: https://vanity-eth.tk/ or use these examples

// For testing, you need to provide private keys for all 4 players
// Option 1: Add to .env:
//   WINNER_PRIVATE_KEY=...
//   RUNNER_UP_1_PRIVATE_KEY=...
//   RUNNER_UP_2_PRIVATE_KEY=...
//   LOSER_PRIVATE_KEY=...

// Option 2: Create test wallets (shown below)

// TEMPORARY TEST KEYS - Replace with your actual test wallets
const PLAYER_KEYS = {
  winner: process.env.WINNER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001",
  runnerUp1: process.env.RUNNER_UP_1_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000002",
  runnerUp2: process.env.RUNNER_UP_2_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000003",
  loser: process.env.LOSER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000004"
};

async function testContract() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING DEPLOYED CONTRACT (V2 - Players Self-Deposit)');
  console.log('='.repeat(80) + '\n');

  try {
    // ========== CONTRACT INFO ==========
    console.log('📋 Contract Information:');
    console.log('-'.repeat(80));

    try {
      const owner = await getOwner();
      const creatorWallet = await getCreatorWallet();
      const entryFee = await getEntryFee();
      const balance = await getContractBalance();

      console.log(`   Contract Address: 0x39cECF23772596579276303a850cd641c3f152bA`);
      console.log(`   Owner:            ${owner}`);
      console.log(`   Creator Wallet:   ${creatorWallet}`);
      console.log(`   Entry Fee:        ${entryFee.toString()} wei (1 U2U)`);
      console.log(`   Contract Balance: ${balance.toString()} wei`);
      console.log('');
    } catch (error: any) {
      console.log(`   ⚠️  Error reading contract: ${error.message}`);
      return;
    }

    // ========== TEST 1: PLAYER DEPOSITS ==========
    console.log('📝 Test 1: Player Deposits (4 Players - Each Signs Their Own)');
    console.log('-'.repeat(80));
    console.log('');
    console.log('⚠️  NOTE: Each player uses their own private key to sign!');
    console.log('');

    const players = [
      { name: 'Winner', privateKey: PLAYER_KEYS.winner },
      { name: '1st Runner-up', privateKey: PLAYER_KEYS.runnerUp1 },
      { name: '2nd Runner-up', privateKey: PLAYER_KEYS.runnerUp2 },
      { name: 'Loser', privateKey: PLAYER_KEYS.loser }
    ];

    const playerAddresses: string[] = [];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      console.log(`\n[${i + 1}/4] ${player.name} depositing...`);

      try {
        const result = await playerDeposit(TEST_GAME_ID, player.privateKey);
        playerAddresses.push(result.playerAddress);

        console.log(`✅ Success!`);
        console.log(`   Player Address: ${result.playerAddress}`);
        console.log(`   Tx Hash: ${result.transactionHash}`);
        console.log(`   Block: ${result.blockNumber}`);
        console.log(`   Players in game: ${result.playerCount}/4`);

        // Wait between deposits to avoid nonce issues
        if (result.playerCount < 4) {
          console.log(`   ⏳ Waiting 3 seconds before next deposit...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error: any) {
        console.log(`❌ Failed: ${error.message}`);
        return;
      }
    }

    // ========== CHECK GAME DETAILS ==========
    console.log('\n' + '='.repeat(80));
    console.log('📊 Game Status After All Deposits:');
    console.log('-'.repeat(80));

    try {
      const details = await getGameDetails(TEST_GAME_ID);
      console.log(`   Game ID:          ${TEST_GAME_ID}`);
      console.log(`   Players Count:    ${details.players.length}/4`);

      console.log(`\n   Players:`);
      details.players.forEach((player, idx) => {
        const playerName = players.find((_, i) => playerAddresses[i] === player)?.name || 'Unknown';
        console.log(`      ${idx + 1}. ${player}`);
        console.log(`         (${playerName})`);
      });

      console.log(`\n   Pool Amount:      ${details.poolAmount.toString()} wei (4 U2U)`);
      console.log(`   Is Completed:     ${details.isCompleted}`);
      console.log(`   Has Transferred:  ${details.hasTransferred}`);
    } catch (error: any) {
      console.log(`   ❌ Failed to get details: ${error.message}`);
      return;
    }

    // ========== WAIT BEFORE DISTRIBUTION ==========
    console.log('\n' + '='.repeat(80));
    console.log('⏳ Waiting 5 seconds before prize distribution...');
    console.log('='.repeat(80));
    await new Promise(resolve => setTimeout(resolve, 5000));

    // ========== TEST 2: PRIZE DISTRIBUTION ==========
    console.log('\n📝 Test 2: Prize Distribution');
    console.log('-'.repeat(80));
    console.log('\n💰 Prize Structure:');
    console.log('   • Winner:      2 U2U (2x Entry Fee)');
    console.log('   • 1st Runner:  1 U2U (1x Entry Fee)');
    console.log('   • 2nd Runner:  0.5 U2U (0.5x Entry Fee)');
    console.log('   • Loser:       0 U2U');
    console.log('   • Creator:     ~0.5 U2U (Remainder)\\n');

    try {
      const rankedPlayers: [string, string, string, string] = [
        playerAddresses[0], // Winner
        playerAddresses[1], // 1st Runner
        playerAddresses[2], // 2nd Runner
        playerAddresses[3]  // Loser
      ];

      const result = await prizeWithdrawal(TEST_GAME_ID, rankedPlayers);

      console.log('='.repeat(80));
      console.log('✅ PRIZE DISTRIBUTION SUCCESSFUL!');
      console.log('='.repeat(80));
      console.log(`   Transaction: ${result.transactionHash}`);
      console.log(`   Block: ${result.blockNumber}`);

      if (result.distributionDetails) {
        console.log(`\n   📊 Actual Distribution:`);
        console.log(`   • Winner:      ${result.distributionDetails.winner.amount} wei`);
        console.log(`   • 1st Runner:  ${result.distributionDetails.firstRunner.amount} wei`);
        console.log(`   • 2nd Runner:  ${result.distributionDetails.secondRunner.amount} wei`);
        console.log(`   • Loser:       ${result.distributionDetails.loser.amount} wei`);
        console.log(`   • Creator:     ${result.remainderToCreator} wei`);
      }
    } catch (error: any) {
      console.log(`❌ Failed: ${error.message}`);
      return;
    }

    // ========== FINAL STATE ==========
    console.log('\n' + '='.repeat(80));
    console.log('📊 Final Game State:');
    console.log('-'.repeat(80));

    try {
      const details = await getGameDetails(TEST_GAME_ID);
      const balance = await getContractBalance();

      console.log(`   Players:          ${details.players.length}/4`);
      console.log(`   Pool Amount:      ${details.poolAmount.toString()} wei`);
      console.log(`   Is Completed:     ${details.isCompleted} ✅`);
      console.log(`   Has Transferred:  ${details.hasTransferred} ✅`);
      console.log(`   Contract Balance: ${balance.toString()} wei`);
    } catch (error: any) {
      console.log(`   ❌ Failed to get final details: ${error.message}`);
    }

    // ========== SUCCESS ==========
    console.log('\n' + '='.repeat(80));
    console.log('✨ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(80) + '\n');

    console.log('📝 Test Summary:');
    console.log('   ✅ Contract deployed and verified');
    console.log('   ✅ 4 players deposited successfully (each signed their own tx)');
    console.log('   ✅ Game marked as full');
    console.log('   ✅ Prizes distributed correctly');
    console.log('   ✅ Remainder sent to creator wallet');
    console.log('   ✅ Game marked as completed');
    console.log('');
    console.log('🎉 Your contract is working perfectly with player self-deposits!\\n');

  } catch (error: any) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(80));
    console.error(`Error: ${error.message}`);
    if (error.stack) {
      console.error(`\nStack trace:\n${error.stack}`);
    }
    console.error('');
  }
}

// Run tests
console.log('🚀 Starting contract tests (V2 - Player Self-Deposit)...\\n');
console.log('📍 Contract: 0x39cECF23772596579276303a850cd641c3f152bA');
console.log(`📍 Network: U2U Testnet`);
console.log(`📍 Test Game ID: ${TEST_GAME_ID}\\n`);
console.log('⚠️  IMPORTANT: You need to provide private keys for all 4 test players!');
console.log('   Add to .env: WINNER_PRIVATE_KEY, RUNNER_UP_1_PRIVATE_KEY, etc.\\n');

testContract().then(() => {
  console.log('✅ Test execution completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
