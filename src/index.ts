import { WebSocketServer } from "ws";
import { distributePrizes } from "./contract/contractFunction/index_celo";
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
    // NOTE: In Celo contract, players deposit for themselves via frontend
    // Server only distributes prizes after game ends

    console.log('📝 Note: Player deposits are handled by players themselves via frontend');
    console.log('📝 This test will only test prize distribution');
    console.log('-'.repeat(60));

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
      if (result.success) {
        console.log(`   ✅ Prize distribution successful!`);
        console.log(`   📝 Tx: ${result.transactionHash}`);
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
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