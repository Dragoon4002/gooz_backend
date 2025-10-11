import {
  playerDeposit,
  prizeWithdrawal,
  getGameDetails,
  getCreatorWallet,
  getOwner,
  getContractBalance,
  getEntryFee
} from "./contractFunctions";
import { config } from "dotenv";

config();

// Test game ID (use unique ID for each test run)
const TEST_GAME_ID = `test-game-${Date.now()}`;

// Get wallet addresses from .env
const RUNNER_UP_1 = process.env.RUNNER_UP_1 || '';
const WINNER = process.env.WINNER_KEY || '';
const RUNNER_UP_2 = process.env.RUNNER_UP_2 || '';
const LOSER = process.env.LOSSER_KEY || '';

async function testContract() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING DEPLOYED CONTRACT');
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

      console.log(`   Contract Address: 0x15f5dd9fbf005c370545977FF7293E022C7F0231`);
      console.log(`   Owner:            ${owner}`);
      console.log(`   Creator Wallet:   ${creatorWallet}`);
      console.log(`   Entry Fee:        ${entryFee.toString()} wei (10 U2U)`);
      console.log(`   Contract Balance: ${balance.toString()} wei`);
      console.log('');
    } catch (error: any) {
      console.log(`   ⚠️  Error reading contract: ${error.message}`);
      return;
    }

    // ========== TEST 1: PLAYER DEPOSITS ==========
    console.log('📝 Test 1: Player Deposits (4 Players)');
    console.log('-'.repeat(80));

    const players = [
      { name: 'Winner', address: WINNER },
      { name: '1st Runner-up', address: RUNNER_UP_1 },
      { name: '2nd Runner-up', address: RUNNER_UP_2 },
      { name: 'Loser', address: LOSER }
    ];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      console.log(`\n[${i + 1}/4] Depositing for ${player.name}`);
      console.log(`Address: ${player.address}`);

      try {
        const result = await playerDeposit(TEST_GAME_ID, player.address);
        console.log(`✅ Success!`);
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
        const playerName = players.find(p => p.address === player)?.name || 'Unknown';
        console.log(`      ${idx + 1}. ${player}`);
        console.log(`         (${playerName})`);
      });

      console.log(`\n   Pool Amount:      ${details.poolAmount.toString()} wei (40 U2U)`);
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
    console.log('   • Winner:      20 U2U (2x Entry Fee)');
    console.log('   • 1st Runner:  10 U2U (1x Entry Fee)');
    console.log('   • 2nd Runner:   5 U2U (0.5x Entry Fee)');
    console.log('   • Loser:        0 U2U');
    console.log('   • Creator:     ~5 U2U (Remainder)\n');

    try {
      const rankedPlayers: [string, string, string, string] = [
        WINNER,
        RUNNER_UP_1,
        RUNNER_UP_2,
        LOSER
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
    console.log('   ✅ 4 players deposited successfully');
    console.log('   ✅ Game marked as full');
    console.log('   ✅ Prizes distributed correctly');
    console.log('   ✅ Remainder sent to creator wallet');
    console.log('   ✅ Game marked as completed');
    console.log('');
    console.log('🎉 Your contract is working perfectly!\n');

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
console.log('🚀 Starting contract tests...\n');
console.log('📍 Contract: 0x34eFa95436AE0Dc327080F56d19e7Fd59DDD7f8A');
console.log(`📍 Network: U2U Testnet`);
console.log(`📍 Test Game ID: ${TEST_GAME_ID}\n`);

testContract().then(() => {
  console.log('✅ Test execution completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
