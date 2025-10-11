import { ethers } from "ethers";
import { config } from "dotenv";

config();

// Contract ABI - Updated for player self-deposit
const ABI = [
  {
    "inputs": [{"internalType": "address", "name": "_creatorWallet", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "gameId", "type": "bytes32"},
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "currentPlayerCount", "type": "uint256"}
    ],
    "name": "PlayerDeposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "gameId", "type": "bytes32"},
      {"indexed": false, "internalType": "uint256", "name": "totalPool", "type": "uint256"}
    ],
    "name": "GameFull",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "gameId", "type": "bytes32"},
      {"indexed": false, "internalType": "address", "name": "winner", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "winnerAmount", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "firstRunner", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "firstRunnerAmount", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "secondRunner", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "secondRunnerAmount", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "lastPlayer", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "lastPlayerAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "remainderToCreator", "type": "uint256"}
    ],
    "name": "PrizeDistributed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "ENTRY_FEE",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "_gameId", "type": "bytes32"}],
    "name": "playerDeposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "_gameId", "type": "bytes32"},
      {"internalType": "address[4]", "name": "_rankedPlayers", "type": "address[4]"}
    ],
    "name": "prizeWithdrawal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "_gameId", "type": "bytes32"}],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "_gameId", "type": "bytes32"}],
    "name": "getGameDetails",
    "outputs": [
      {"internalType": "address[]", "name": "players", "type": "address[]"},
      {"internalType": "uint256", "name": "poolAmount", "type": "uint256"},
      {"internalType": "bool", "name": "isCompleted", "type": "bool"},
      {"internalType": "bool", "name": "hasTransferred", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "_gameId", "type": "bytes32"},
      {"internalType": "address", "name": "_player", "type": "address"}
    ],
    "name": "hasPlayerDeposited",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creatorWallet",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = process.env.FINAL_CONTRACT_ADDRESS || "0x39cECF23772596579276303a850cd641c3f152bA";
const RPC_URL = process.env.RPC_URL || "https://rpc-nebulas-testnet.u2u.xyz";
const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY;

// Provider and contracts
const provider = new ethers.JsonRpcProvider(RPC_URL);
const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

let ownerContract: ethers.Contract | null = null;
if (OWNER_PRIVATE_KEY) {
  const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
  ownerContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, ownerWallet);
}

// ============ TYPES ============

export interface TransactionRequest {
  to: string;
  data: string;
  value: string;
  chainId: number;
}

export interface GameDetails {
  players: string[];
  poolAmount: bigint;
  isCompleted: boolean;
  hasTransferred: boolean;
}

// ============ HELPER FUNCTIONS ============

function gameIdToBytes32(gameId: string): string {
  return ethers.id(gameId);
}

function formatU2U(amount: bigint): string {
  return ethers.formatEther(amount);
}

// ============ BACKEND FUNCTIONS ============

/**
 * Prepare deposit transaction for player to sign on frontend
 * Backend only needs player's address - frontend handles signing
 *
 * @param gameId - The game identifier
 * @param playerAddress - Player's wallet address (from frontend)
 * @returns Transaction data for frontend to sign
 */
export async function prepareDepositTransaction(
  gameId: string,
  playerAddress: string
): Promise<TransactionRequest> {
  const gameIdBytes32 = gameIdToBytes32(gameId);
  const entryFee = await readOnlyContract.ENTRY_FEE();

  // Check if player already deposited
  const hasDeposited = await readOnlyContract.hasPlayerDeposited(gameIdBytes32, playerAddress);
  if (hasDeposited) {
    throw new Error(`Player ${playerAddress} already deposited for game ${gameId}`);
  }

  // Prepare transaction data
  const data = readOnlyContract.interface.encodeFunctionData("playerDeposit", [gameIdBytes32]);

  const network = await provider.getNetwork();

  return {
    to: CONTRACT_ADDRESS,
    data: data,
    value: entryFee.toString(),
    chainId: Number(network.chainId)
  };
}

/**
 * Notify backend when player has deposited (frontend calls this after transaction confirms)
 *
 * @param gameId - The game identifier
 * @param playerAddress - Player who deposited
 * @param txHash - Transaction hash from blockchain
 * @returns Confirmation with player count
 */
export async function confirmPlayerDeposit(
  gameId: string,
  playerAddress: string,
  txHash: string
): Promise<{ confirmed: boolean; playerCount: number; txHash: string }> {
  try {
    // Wait for transaction confirmation
    const receipt = await provider.getTransaction(txHash);
    if (!receipt) {
      throw new Error("Transaction not found");
    }

    await receipt.wait();

    // Verify player is now in the game
    const gameIdBytes32 = gameIdToBytes32(gameId);
    const hasDeposited = await readOnlyContract.hasPlayerDeposited(gameIdBytes32, playerAddress);

    if (!hasDeposited) {
      throw new Error("Deposit not confirmed on blockchain");
    }

    const details = await getGameDetails(gameId);

    console.log(`✅ Deposit confirmed for ${playerAddress}`);
    console.log(`   Game: ${gameId}`);
    console.log(`   Players: ${details.players.length}/4`);
    console.log(`   Tx: ${txHash}`);

    return {
      confirmed: true,
      playerCount: details.players.length,
      txHash: txHash
    };
  } catch (error: any) {
    console.error(`❌ Failed to confirm deposit: ${error.message}`);
    throw error;
  }
}

/**
 * Distribute prizes (Owner only - backend signs this)
 *
 * @param gameId - The game identifier
 * @param rankedPlayers - Array of [winner, runner1, runner2, loser] addresses
 * @returns Transaction receipt
 */
export async function distributePrizes(
  gameId: string,
  rankedPlayers: [string, string, string, string]
): Promise<{ success: boolean; txHash: string; blockNumber: number }> {
  if (!ownerContract) {
    throw new Error("Owner contract not initialized. Check PRIVATE_KEY in .env");
  }

  const gameIdBytes32 = gameIdToBytes32(gameId);

  console.log(`\n🏆 Distributing prizes for game ${gameId}...`);
  console.log(`   Winner:       ${rankedPlayers[0]}`);
  console.log(`   1st Runner:   ${rankedPlayers[1]}`);
  console.log(`   2nd Runner:   ${rankedPlayers[2]}`);
  console.log(`   Loser:        ${rankedPlayers[3]}`);

  // Verify game is ready
  const details = await getGameDetails(gameId);
  if (details.players.length !== 4) {
    throw new Error(`Game not full. Players: ${details.players.length}/4`);
  }
  if (details.hasTransferred) {
    throw new Error("Prizes already distributed");
  }

  const tx = await ownerContract.prizeWithdrawal(gameIdBytes32, rankedPlayers);
  console.log(`   📝 Transaction sent: ${tx.hash}`);
  console.log(`   ⏳ Waiting for confirmation...`);

  const receipt = await tx.wait();
  console.log(`   ✅ Prizes distributed! Block: ${receipt.blockNumber}`);

  return {
    success: true,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber
  };
}

/**
 * Emergency withdrawal - refunds all players (Owner only - backend signs)
 *
 * @param gameId - The game identifier
 * @returns Transaction receipt
 */
export async function refundGame(
  gameId: string
): Promise<{ success: boolean; txHash: string; playersRefunded: number }> {
  if (!ownerContract) {
    throw new Error("Owner contract not initialized. Check PRIVATE_KEY in .env");
  }

  const gameIdBytes32 = gameIdToBytes32(gameId);
  const details = await getGameDetails(gameId);

  if (details.players.length === 0) {
    throw new Error("No players to refund");
  }
  if (details.hasTransferred) {
    throw new Error("Game already completed");
  }

  console.log(`⚠️  Refunding ${details.players.length} players for game ${gameId}...`);

  const tx = await ownerContract.emergencyWithdraw(gameIdBytes32);
  console.log(`   📝 Transaction sent: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`   ✅ Refund successful! Block: ${receipt.blockNumber}`);

  return {
    success: true,
    txHash: tx.hash,
    playersRefunded: details.players.length
  };
}

/**
 * Get game details
 */
export async function getGameDetails(gameId: string): Promise<GameDetails> {
  const gameIdBytes32 = gameIdToBytes32(gameId);
  const details = await readOnlyContract.getGameDetails(gameIdBytes32);

  return {
    players: details[0],
    poolAmount: details[1],
    isCompleted: details[2],
    hasTransferred: details[3]
  };
}

/**
 * Check if player has deposited
 */
export async function hasPlayerDeposited(gameId: string, playerAddress: string): Promise<boolean> {
  const gameIdBytes32 = gameIdToBytes32(gameId);
  return await readOnlyContract.hasPlayerDeposited(gameIdBytes32, playerAddress);
}

/**
 * Get entry fee amount
 */
export async function getEntryFee(): Promise<bigint> {
  return await readOnlyContract.ENTRY_FEE();
}

/**
 * Get contract info
 */
export async function getContractInfo() {
  const entryFee = await readOnlyContract.ENTRY_FEE();
  const owner = await readOnlyContract.owner();
  const creatorWallet = await readOnlyContract.creatorWallet();

  return {
    contractAddress: CONTRACT_ADDRESS,
    entryFee: entryFee.toString(),
    entryFeeFormatted: formatU2U(entryFee) + " U2U",
    owner,
    creatorWallet,
    chainId: (await provider.getNetwork()).chainId
  };
}

// Export constants
export { CONTRACT_ADDRESS, RPC_URL, ABI, gameIdToBytes32, formatU2U };
