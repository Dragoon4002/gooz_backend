import { playerDeposit, prizeWithdrawal, getGameDetails, getCreatorWallet } from "./src/contract/contractFunction/finalContract";
import { config } from "dotenv";

config();

// Test game ID
const TEST_GAME_ID = "final-test-game-001";

// Get wallet addresses from .env
const RUNNER_UP_1 = process.env.RUNNER_UP_1 || '';
const WINNER = process.env.WINNER_KEY || '';
const RUNNER_UP_2 = process.env.RUNNER_UP_2 || '';
const LOSER = process.env.LOSSER_KEY || '';

async function testFinalContract() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING FINAL CONTRACT');
  console.log('='.repeat(70) + '\n');

  try {
    // Display contract info
    console.log('📋 Contract Information:');
    console.log('-'.repeat(70));
    try {
      const creatorWallet = await getCreatorWallet();
      console.log(`   Creator Wallet: ${creatorWallet}`);
    } catch (error) {
      console.log(`   Creator Wallet: Not yet deployed`);
    }
    console.log('');

    // Test 1: Player Deposits
    console.log('📝 Test 1: Player Deposits');
    console.log('-'.repeat(70));

    const players = [
      { name: 'Winner', address: WINNER },
      { name: '1st Runner-up', address: RUNNER_UP_1 },
      { name: '2nd Runner-up', address: RUNNER_UP_2 },
      { name: 'Loser', address: LOSER }
    ];

    for (const player of players) {
      console.log(`\n💰 Depositing for ${player.name} (${player.address})...`);
      try {
        const result = await playerDeposit(TEST_GAME_ID, player.address);
        console.log(`   ✅ Success!`);
        console.log(`   📝 Tx: ${result.transactionHash}`);
        console.log(`   📦 Block: ${result.blockNumber}`);
      } catch (error: any) {
        console.log(`   ❌ Failed: ${error.message}`);
        if (error.message.includes("Game is full") || error.message.includes("Player already deposited")) {
          console.log(`   ℹ️  This is expected if running the test again with the same game ID`);
        }
      }
    }

    // Check game details
    console.log('\n' + '='.repeat(70));
    console.log('📊 Checking Game Details...');
    console.log('-'.repeat(70));
    try {
      const details = await getGameDetails(TEST_GAME_ID);
      console.log(`   Players: ${details.players.length}`);
      details.players.forEach((player, idx) => {
        console.log(`      ${idx + 1}. ${player}`);
      });
      console.log(`   Pool Amount: ${details.poolAmount.toString()} wei`);
      console.log(`   Is Completed: ${details.isCompleted}`);
      console.log(`   Has Transferred: ${details.hasTransferred}`);
    } catch (error: any) {
      console.log(`   ❌ Failed to get details: ${error.message}`);
    }

    // Wait before prize distribution
    console.log('\n' + '='.repeat(70));
    console.log('⏳ Waiting 5 seconds before prize distribution...');
    console.log('='.repeat(70));
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test 2: Prize Distribution
    console.log('\n📝 Test 2: Prize Distribution');
    console.log('-'.repeat(70));
    console.log(`\n🏆 Distributing prizes for game ${TEST_GAME_ID}:`);
    console.log(`   Winner:       ${WINNER}`);
    console.log(`   1st Runner:   ${RUNNER_UP_1}`);
    console.log(`   2nd Runner:   ${RUNNER_UP_2}`);
    console.log(`   Loser:        ${LOSER}`);
    console.log(`\n   Prize Distribution:`);
    console.log(`   • Winner:      2x Entry Fee (20 U2U)`);
    console.log(`   • 1st Runner:  1x Entry Fee (10 U2U)`);
    console.log(`   • 2nd Runner:  0.5x Entry Fee (5 U2U)`);
    console.log(`   • Loser:       0 U2U`);
    console.log(`   • Creator:     Remaining funds (even if transfers fail)\n`);

    try {
      const rankedPlayers: [string, string, string, string] = [
        WINNER,
        RUNNER_UP_1,
        RUNNER_UP_2,
        LOSER
      ];

      const result = await prizeWithdrawal(TEST_GAME_ID, rankedPlayers);
      console.log(`   ✅ Prize distribution successful!`);
      console.log(`   📝 Tx: ${result.transactionHash}`);
      console.log(`   📦 Block: ${result.blockNumber}`);
      console.log(`   💰 Remainder to Creator: ${result.remainderToCreator.toString()} wei`);
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
      if (error.message.includes("Prizes already transferred")) {
        console.log(`   ℹ️  This is expected if running the test again with the same game ID`);
      }
    }

    // Final game details
    console.log('\n' + '='.repeat(70));
    console.log('📊 Final Game State:');
    console.log('-'.repeat(70));
    try {
      const details = await getGameDetails(TEST_GAME_ID);
      console.log(`   Players: ${details.players.length}`);
      console.log(`   Pool Amount: ${details.poolAmount.toString()} wei`);
      console.log(`   Is Completed: ${details.isCompleted}`);
      console.log(`   Has Transferred: ${details.hasTransferred}`);
    } catch (error: any) {
      console.log(`   ❌ Failed to get details: ${error.message}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✨ Final contract tests completed!');
    console.log('='.repeat(70) + '\n');

    console.log('📝 Notes:');
    console.log('   • ALL remaining funds go to creator wallet (even if transfers fail)');
    console.log('   • No complex failed transfer tracking needed');
    console.log('   • Simpler, more straightforward implementation');
    console.log('   • Use a different TEST_GAME_ID to run tests again\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run tests
testFinalContract();
