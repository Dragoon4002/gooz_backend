import { ethers } from "ethers";
import {
  prepareDepositTransaction,
  confirmPlayerDeposit,
  distributePrizes,
  getGameDetails,
  getContractInfo,
  hasPlayerDeposited,
  RPC_URL
} from "./contractBackend";
import { config } from "dotenv";

config();

// Test game ID
const TEST_GAME_ID = `test-game-${Date.now()}`;

// Player addresses from .env (Backend only knows these)
const PLAYER_ADDRESSES = {
  winner: process.env.WINNER_KEY || "",
  runnerUp1: process.env.RUNNER_UP_1 || "",
  runnerUp2: process.env.RUNNER_UP_2 || "",
  loser: process.env.LOSSER_KEY || ""
};

// For TESTING ONLY: Simulate frontend signing
// In production, frontend handles this with MetaMask
const PLAYER_PRIVATE_KEYS = {
  winner: process.env.WINNER_PRIVATE_KEY || "",
  runnerUp1: process.env.RUNNER_UP_1_PRIVATE_KEY || "",
  runnerUp2: process.env.RUNNER_UP_2_PRIVATE_KEY || "",
  loser: process.env.LOSSER_PRIVATE_KEY || ""  // Note: LOSSER with double S to match .env
};

/**
 * SIMULATE FRONTEND: Sign and send transaction
 * In production, this happens on frontend with MetaMask
 */
async function simulateFrontendSigning(
  transactionRequest: any,
  playerPrivateKey: string
): Promise<string> {
  if (!playerPrivateKey) {
    throw new Error("Player private key required for testing. In production, frontend handles this.");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const playerWallet = new ethers.Wallet(playerPrivateKey, provider);

  console.log(`   🔐 [Frontend Simulation] Player ${playerWallet.address} signing transaction...`);

  const tx = await playerWallet.sendTransaction({
    to: transactionRequest.to,
    data: transactionRequest.data,
    value: transactionRequest.value
  });

  console.log(`   📝 [Frontend Simulation] Transaction sent: ${tx.hash}`);
  console.log(`   ⏳ [Frontend Simulation] Waiting for confirmation...`);

  await tx.wait();

  console.log(`   ✅ [Frontend Simulation] Transaction confirmed!`);

  return tx.hash;
}

/**
 * MAIN TEST
 */
async function testBackendFlow() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING BACKEND INTEGRATION (Frontend Signing Simulation)');
  console.log('='.repeat(80) + '\n');

  console.log('📝 Architecture:');
  console.log('   • Backend: Only knows player addresses + owner private key');
  console.log('   • Frontend: Players sign with their own wallets (MetaMask)');
  console.log('   • Contract: Uses msg.sender to identify player\n');

  try {
    // ========== CONTRACT INFO ==========
    console.log('📋 Contract Information:');
    console.log('-'.repeat(80));

    const info = await getContractInfo();
    console.log(`   Contract Address: ${info.contractAddress}`);
    console.log(`   Owner:            ${info.owner}`);
    console.log(`   Creator Wallet:   ${info.creatorWallet}`);
    console.log(`   Entry Fee:        ${info.entryFeeFormatted}`);
    console.log(`   Chain ID:         ${info.chainId}`);
    console.log('');

    // ========== PLAYER DEPOSITS ==========
    console.log('📝 Test: Player Deposits (4 Players)');
    console.log('-'.repeat(80));
    console.log('');

    const players = [
      { name: 'Winner', address: PLAYER_ADDRESSES.winner, privateKey: PLAYER_PRIVATE_KEYS.winner },
      { name: '1st Runner-up', address: PLAYER_ADDRESSES.runnerUp1, privateKey: PLAYER_PRIVATE_KEYS.runnerUp1 },
      { name: '2nd Runner-up', address: PLAYER_ADDRESSES.runnerUp2, privateKey: PLAYER_PRIVATE_KEYS.runnerUp2 },
      { name: 'Loser', address: PLAYER_ADDRESSES.loser, privateKey: PLAYER_PRIVATE_KEYS.loser }
    ];

    const depositedPlayers: string[] = [];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      console.log(`\n[${i + 1}/4] ${player.name}`);
      console.log(`   Address: ${player.address}`);

      try {
        // STEP 1: Backend prepares transaction
        console.log(`   🔧 [Backend] Preparing deposit transaction...`);
        const txRequest = await prepareDepositTransaction(TEST_GAME_ID, player.address);

        console.log(`   ✅ [Backend] Transaction prepared:`);
        console.log(`      To: ${txRequest.to}`);
        console.log(`      Value: ${ethers.formatEther(txRequest.value)} U2U`);
        console.log(`      Data: ${txRequest.data.substring(0, 20)}...`);

        // STEP 2: "Send to frontend" (in production, backend sends txRequest to frontend)
        console.log(`   📤 [Backend] Sending transaction request to frontend...`);

        // STEP 3: Frontend signs and sends (simulated here)
        const txHash = await simulateFrontendSigning(txRequest, player.privateKey);

        // STEP 4: Frontend notifies backend of transaction hash
        console.log(`   📨 [Frontend → Backend] Transaction hash: ${txHash}`);

        // STEP 5: Backend confirms deposit
        console.log(`   🔍 [Backend] Confirming deposit on blockchain...`);
        const confirmation = await confirmPlayerDeposit(TEST_GAME_ID, player.address, txHash);

        console.log(`   ✅ [Backend] Deposit confirmed!`);
        console.log(`      Players in game: ${confirmation.playerCount}/4`);

        depositedPlayers.push(player.address);

        // Wait between deposits
        if (confirmation.playerCount < 4) {
          console.log(`   ⏳ Waiting 3 seconds before next deposit...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error: any) {
        console.log(`   ❌ Failed: ${error.message}`);
        return;
      }
    }

    // ========== GAME STATUS ==========
    console.log('\n' + '='.repeat(80));
    console.log('📊 Game Status After All Deposits:');
    console.log('-'.repeat(80));

    const details = await getGameDetails(TEST_GAME_ID);
    console.log(`   Game ID:          ${TEST_GAME_ID}`);
    console.log(`   Players Count:    ${details.players.length}/4`);
    console.log(`   Pool Amount:      ${ethers.formatEther(details.poolAmount)} U2U`);
    console.log(`   Is Completed:     ${details.isCompleted}`);
    console.log(`   Has Transferred:  ${details.hasTransferred}`);

    console.log(`\n   Players in contract:`);
    details.players.forEach((addr, idx) => {
      const playerName = players.find(p => p.address === addr)?.name || 'Unknown';
      console.log(`      ${idx + 1}. ${addr} (${playerName})`);
    });

    // Verify all deposits
    console.log(`\n   Verification:`);
    for (const player of players) {
      const deposited = await hasPlayerDeposited(TEST_GAME_ID, player.address);
      console.log(`      ${player.name}: ${deposited ? '✅ Deposited' : '❌ Not deposited'}`);
    }

    console.log('');

    // ========== WAIT BEFORE DISTRIBUTION ==========
    console.log('='.repeat(80));
    console.log('⏳ Waiting 5 seconds before prize distribution...');
    console.log('='.repeat(80));
    await new Promise(resolve => setTimeout(resolve, 5000));

    // ========== PRIZE DISTRIBUTION ==========
    console.log('\n📝 Test: Prize Distribution (Owner Signs)');
    console.log('-'.repeat(80));
    console.log('\n💰 Prize Structure:');
    console.log('   • Winner:      2 U2U (2x Entry Fee)');
    console.log('   • 1st Runner:  1 U2U (1x Entry Fee)');
    console.log('   • 2nd Runner:  0.5 U2U (0.5x Entry Fee)');
    console.log('   • Loser:       0 U2U');
    console.log('   • Creator:     ~0.5 U2U (Remainder)\n');

    try {
      // Backend determines rankings and signs distribution
      const rankedPlayers: [string, string, string, string] = [
        depositedPlayers[0], // Winner
        depositedPlayers[1], // 1st Runner
        depositedPlayers[2], // 2nd Runner
        depositedPlayers[3]  // Loser
      ];

      console.log('   🔧 [Backend] Owner signing prize distribution...');
      const result = await distributePrizes(TEST_GAME_ID, rankedPlayers);

      console.log('');
      console.log('='.repeat(80));
      console.log('✅ PRIZE DISTRIBUTION SUCCESSFUL!');
      console.log('='.repeat(80));
      console.log(`   Transaction: ${result.txHash}`);
      console.log(`   Block: ${result.blockNumber}`);

    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
      return;
    }

    // ========== FINAL STATE ==========
    console.log('\n' + '='.repeat(80));
    console.log('📊 Final Game State:');
    console.log('-'.repeat(80));

    const finalDetails = await getGameDetails(TEST_GAME_ID);
    console.log(`   Players:          ${finalDetails.players.length}/4`);
    console.log(`   Pool Amount:      ${ethers.formatEther(finalDetails.poolAmount)} U2U`);
    console.log(`   Is Completed:     ${finalDetails.isCompleted} ✅`);
    console.log(`   Has Transferred:  ${finalDetails.hasTransferred} ✅`);

    // ========== SUCCESS ==========
    console.log('\n' + '='.repeat(80));
    console.log('✨ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(80) + '\n');

    console.log('📝 Test Summary:');
    console.log('   ✅ Backend prepared 4 deposit transactions');
    console.log('   ✅ Players signed their own deposits (simulated)');
    console.log('   ✅ Backend confirmed all deposits');
    console.log('   ✅ Game marked as full (4/4 players)');
    console.log('   ✅ Owner distributed prizes');
    console.log('   ✅ Game completed successfully');
    console.log('');
    console.log('🎉 Backend integration working perfectly!\n');

    console.log('📋 Production Flow:');
    console.log('   1. Backend: prepareDepositTransaction(gameId, playerAddress)');
    console.log('   2. Backend → Frontend: Send transaction request');
    console.log('   3. Frontend: Player signs with MetaMask');
    console.log('   4. Frontend → Backend: Send transaction hash');
    console.log('   5. Backend: confirmPlayerDeposit(gameId, playerAddress, txHash)');
    console.log('   6. When game ends: distributePrizes(gameId, rankedPlayers)');
    console.log('');

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
console.log('🚀 Starting backend integration tests...\n');
console.log('📍 Contract: ' + (process.env.FINAL_CONTRACT_ADDRESS || "0x39cECF23772596579276303a850cd641c3f152bA"));
console.log(`📍 Network: U2U Testnet`);
console.log(`📍 Test Game ID: ${TEST_GAME_ID}\n`);

testBackendFlow()
  .then(() => {
    console.log('✅ Test execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
