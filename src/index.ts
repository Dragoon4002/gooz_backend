import { WebSocketServer } from "ws";
import { playerDeposit, distributePrizes } from "./contract/contractFunction";
import { config } from "dotenv";

config();

// Test game ID (string for bytes32 conversion)
const TEST_GAME_ID = "test-game-12356";

// Get wallet addresses from .env
const RUNNER_UP_1 = process.env.RUNNER_UP_1 || '';
const WINNER = process.env.WINNER_KEY || '';
const RUNNER_UP_2 = process.env.RUNNER_UP_2 || '';
const LOSER = process.env.LOSSER_KEY || '';

async function testContractFunctions() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TESTING CONTRACT FUNCTIONS');
  console.log('='.repeat(60) + '\n');

  try {
    // Test 1: Player Deposits
    console.log('📝 Test 1: Player Deposits');
    console.log('-'.repeat(60));

    const players = [
      { name: 'RUNNER_UP_1', address: RUNNER_UP_1 },
      { name: 'WINNER', address: WINNER },
      { name: 'RUNNER_UP_2', address: RUNNER_UP_2 },
      { name: 'LOSER', address: LOSER }
    ];

    for (const player of players) {
      console.log(`\n💰 Depositing for ${player.name} (${player.address})...`);
      try {
        const result = await playerDeposit(TEST_GAME_ID, player.address);
        console.log(`   ✅ Success! Tx: ${result.transactionHash}`);
        console.log(`   📦 Block: ${result.blockNumber}`);
      } catch (error: any) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('⏳ Waiting 5 seconds before prize distribution...');
    console.log('='.repeat(60));
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test 2: Prize Distribution
    console.log('\n📝 Test 2: Prize Distribution');
    console.log('-'.repeat(60));
    console.log(`\n🏆 Distributing prizes for game ${TEST_GAME_ID}:`);
    console.log(`   Winner:       ${WINNER}`);
    console.log(`   1st Runner:   ${RUNNER_UP_1}`);
    console.log(`   2nd Runner:   ${RUNNER_UP_2}`);
    console.log(`   Loser:        ${LOSER}\n`);

    try {
      const rankedPlayers: [string, string, string, string] = [
        WINNER,
        RUNNER_UP_1,
        RUNNER_UP_2,
        LOSER
      ];

      const result = await distributePrizes(TEST_GAME_ID, rankedPlayers);
      console.log(`   ✅ Prize distribution successful!`);
      console.log(`   📝 Tx: ${result.transactionHash}`);
      console.log(`   📦 Block: ${result.blockNumber}`);

      if (result.failedTransfers && result.failedTransfers.length > 0) {
        console.log(`   ⚠️  Failed transfers detected - see warnings above`);
      }
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Contract tests completed!');
    console.log('='.repeat(60) + '\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests on startup
testContractFunctions();