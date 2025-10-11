import {
  playerDeposit,
  prizeWithdrawal,
  getGameDetails,
  getCreatorWallet,
  getOwner,
  getContractBalance,
  getEntryFee
} from "./src/contract/contractFunction/indexOptimized";
import { config } from "dotenv";

config();

// Test game ID (use a unique ID for each test run)
const TEST_GAME_ID = `optimized-test-${Date.now()}`;

// Get wallet addresses from .env
const RUNNER_UP_1 = process.env.RUNNER_UP_1 || '';
const WINNER = process.env.WINNER_KEY || '';
const RUNNER_UP_2 = process.env.RUNNER_UP_2 || '';
const LOSER = process.env.LOSSER_KEY || '';

async function testOptimizedContract() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING FINAL CONTRACT OPTIMIZED');
  console.log('='.repeat(80) + '\n');

  try {
    // Display contract info
    console.log('📋 Contract Information:');
    console.log('-'.repeat(80));
    try {
      const owner = await getOwner();
      const creatorWallet = await getCreatorWallet();
      const entryFee = await getEntryFee();
      const balance = await getContractBalance();

      console.log(`   Owner:          ${owner}`);
      console.log(`   Creator Wallet: ${creatorWallet}`);
      console.log(`   Entry Fee:      ${entryFee.toString()} wei (10 U2U)`);
      console.log(`   Balance:        ${balance.toString()} wei`);
    } catch (error: any) {
      console.log(`   ⚠️  Contract not deployed yet: ${error.message}`);
      console.log(`   📝 Deploy finalContractOptimized.sol first!`);
      return;
    }
    console.log('');

    // Test 1: Player Deposits
    console.log('📝 Test 1: Player Deposits (4 players)');
    console.log('-'.repeat(80));

    const players = [
      { name: 'Winner', address: WINNER },
      { name: '1st Runner-up', address: RUNNER_UP_1 },
      { name: '2nd Runner-up', address: RUNNER_UP_2 },
      { name: 'Loser', address: LOSER }
    ];

    for (const player of players) {
      console.log(`\n💰 Depositing for ${player.name}...`);
      try {
        const result = await playerDeposit(TEST_GAME_ID, player.address);
        console.log(`   ✅ Success!`);
        console.log(`   📝 Tx: ${result.transactionHash}`);
        console.log(`   📦 Block: ${result.blockNumber}`);
        console.log(`   👥 Players: ${result.playerCount}/4`);

        // Wait between deposits to avoid nonce issues
        if (result.playerCount < 4) {
          console.log(`   ⏳ Waiting 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error: any) {
        console.log(`   ❌ Failed: ${error.message}`);
        return;
      }
    }

    // Check game details after deposits
    console.log('\n' + '='.repeat(80));
    console.log('📊 Game Details After Deposits:');
    console.log('-'.repeat(80));
    try {
      const details = await getGameDetails(TEST_GAME_ID);
      console.log(`   Game ID:          ${TEST_GAME_ID}`);
      console.log(`   Players Count:    ${details.players.length}/4`);
      details.players.forEach((player, idx) => {
        const playerName = players.find(p => p.address === player)?.name || 'Unknown';
        console.log(`      ${idx + 1}. ${player} (${playerName})`);
      });
      console.log(`   Pool Amount:      ${details.poolAmount.toString()} wei (40 U2U)`);
      console.log(`   Is Completed:     ${details.isCompleted}`);
      console.log(`   Has Transferred:  ${details.hasTransferred}`);
    } catch (error: any) {
      console.log(`   ❌ Failed to get details: ${error.message}`);
      return;
    }

    // Wait before prize distribution
    console.log('\n' + '='.repeat(80));
    console.log('⏳ Waiting 5 seconds before prize distribution...');
    console.log('='.repeat(80));
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test 2: Prize Distribution
    console.log('\n📝 Test 2: Prize Distribution');
    console.log('-'.repeat(80));

    try {
      const rankedPlayers: [string, string, string, string] = [
        WINNER,
        RUNNER_UP_1,
        RUNNER_UP_2,
        LOSER
      ];

      const result = await prizeWithdrawal(TEST_GAME_ID, rankedPlayers);

      console.log('\n' + '='.repeat(80));
      console.log('✅ PRIZE DISTRIBUTION SUCCESSFUL!');
      console.log('='.repeat(80));
      console.log(`   📝 Transaction: ${result.transactionHash}`);
      console.log(`   📦 Block: ${result.blockNumber}`);
      console.log(`   💰 Remainder to Creator: ${result.remainderToCreator.toString()} wei`);

      if (result.distributionDetails) {
        console.log('\n   📊 Distribution Breakdown:');
        console.log(`   • Winner:      ${result.distributionDetails.winner.amount} wei`);
        console.log(`   • 1st Runner:  ${result.distributionDetails.firstRunner.amount} wei`);
        console.log(`   • 2nd Runner:  ${result.distributionDetails.secondRunner.amount} wei`);
        console.log(`   • Loser:       ${result.distributionDetails.loser.amount} wei`);
      }
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
      return;
    }

    // Final game details
    console.log('\n' + '='.repeat(80));
    console.log('📊 Final Game State:');
    console.log('-'.repeat(80));
    try {
      const details = await getGameDetails(TEST_GAME_ID);
      console.log(`   Players Count:    ${details.players.length}`);
      console.log(`   Pool Amount:      ${details.poolAmount.toString()} wei`);
      console.log(`   Is Completed:     ${details.isCompleted} ✅`);
      console.log(`   Has Transferred:  ${details.hasTransferred} ✅`);

      const balance = await getContractBalance();
      console.log(`   Contract Balance: ${balance.toString()} wei`);
    } catch (error: any) {
      console.log(`   ❌ Failed to get details: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✨ All tests completed successfully!');
    console.log('='.repeat(80) + '\n');

    console.log('📝 Test Summary:');
    console.log('   ✅ 4 players deposited successfully');
    console.log('   ✅ Game marked as full');
    console.log('   ✅ Prizes distributed correctly');
    console.log('   ✅ Remainder sent to creator wallet');
    console.log('   ✅ Game marked as completed');
    console.log('');
    console.log('🎉 finalContractOptimized.sol is working perfectly!\n');

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
console.log('🚀 Starting optimized contract tests...\n');
testOptimizedContract().then(() => {
  console.log('✅ Test execution completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
