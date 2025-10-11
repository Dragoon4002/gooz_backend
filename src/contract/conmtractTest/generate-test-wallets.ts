import { ethers } from "ethers";

console.log('\n' + '='.repeat(80));
console.log('🔑 GENERATING TEST WALLETS FOR MONOPOLY GAME');
console.log('='.repeat(80) + '\n');

console.log('Creating 4 test wallets...\n');

const walletNames = ['Winner', '1st Runner-up', '2nd Runner-up', 'Loser'];

for (let i = 0; i < 4; i++) {
  const wallet = ethers.Wallet.createRandom();

  console.log(`${walletNames[i]}:`);
  console.log(`  Address:     ${wallet.address}`);
  console.log(`  Private Key: ${wallet.privateKey}`);
  console.log('');
}

console.log('='.repeat(80));
console.log('📝 NEXT STEPS:');
console.log('='.repeat(80));
console.log('');
console.log('1. Copy the private keys above');
console.log('');
console.log('2. Add to your .env file:');
console.log('   WINNER_PRIVATE_KEY=<paste Winner private key>');
console.log('   RUNNER_UP_1_PRIVATE_KEY=<paste 1st Runner-up private key>');
console.log('   RUNNER_UP_2_PRIVATE_KEY=<paste 2nd Runner-up private key>');
console.log('   LOSER_PRIVATE_KEY=<paste Loser private key>');
console.log('');
console.log('3. Fund each wallet with 1.5 U2U from faucet');
console.log('');
console.log('4. Run tests:');
console.log('   npx ts-node src/contract/conmtractTest/index_v2.ts');
console.log('');
console.log('⚠️  IMPORTANT: These are TEST wallets for testnet only!');
console.log('   Never use them on mainnet or with real funds!');
console.log('');
