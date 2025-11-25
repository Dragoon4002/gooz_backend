import { ethers } from "ethers";
import { config } from "dotenv";

config();

/**
 * Celo Mainnet Integration for Monopoly Game
 *
 * Network Details:
 * - Chain ID: 42220 (0xa4ec)
 * - Currency: CELO
 * - Block Gas Limit: 30000000
 * - RPC: https://forno.celo.org
 *
 * Prize Distribution (0.01 CELO entry fee per player):
 * - Winner: 0.02 CELO (50%)
 * - 1st Runner: 0.01 CELO (25%)
 * - 2nd Runner: 0.005 CELO (12.5%)
 * - Last Place: 0.0025 CELO (6.25%)
 * - Platform Fee: 0.0025 CELO (6.25%)
 */

// Celo Network Configuration
const CELO_MAINNET_RPC = process.env.CELO_MAINNET_RPC || "https://forno.celo.org";
const CELO_TESTNET_RPC = process.env.CELO_TESTNET_RPC || "https://alfajores-forno.celo-testnet.org"; // Alfajores testnet

const USE_TESTNET = process.env.USE_TESTNET === 'true';
const RPC_URL = USE_TESTNET ? CELO_TESTNET_RPC : CELO_MAINNET_RPC;
const CONTRACT_ADDRESS = USE_TESTNET
  ? process.env.CELO_TESTNET_CONTRACT_ADDRESS
  : process.env.CELO_MAINNET_CONTRACT_ADDRESS;

const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract ABI for Celo version
const CONTRACT_ABI = [
  "function playerDeposit(bytes32 _gameId) external payable",
  "function prizeWithdrawal(bytes32 _gameId, address[4] memory _rankedPlayers) external",
  "function cancelGame(bytes32 _gameId, string memory _reason) external",
  "function emergencyWithdraw(bytes32 _gameId, string memory _reason) external",
  "function claimPrize(bytes32 _gameId) external",
  "function getGameDetails(bytes32 _gameId) external view returns (address[] memory players, uint256 poolAmount, bool isCompleted, bool isCancelled)",
  "function getPlayers(bytes32 _gameId) external view returns (address[] memory)",
  "function getPlayerCount(bytes32 _gameId) external view returns (uint256)",
  "function getPoolAmount(bytes32 _gameId) external view returns (uint256)",
  "function isGameCompleted(bytes32 _gameId) external view returns (bool)",
  "function isGameCancelled(bytes32 _gameId) external view returns (bool)",
  "function hasPlayerDeposited(bytes32 _gameId, address _player) external view returns (bool)",
  "function getUnclaimedPrize(bytes32 _gameId, address _player) external view returns (uint256)",
  "function getContractBalance() external view returns (uint256)",
  "function getPrizeDistribution() external pure returns (uint256 winner, uint256 firstRunner, uint256 secondRunner, uint256 lastPlace, uint256 platformFee)",
  "function transferOwnership(address _newOwner) external",
  "function ENTRY_FEE() external view returns (uint256)",
  "function TOTAL_PLAYERS() external view returns (uint256)",
  "function owner() external view returns (address)",

  // Events
  "event PlayerDeposited(bytes32 indexed gameId, address indexed player, uint256 amount, uint256 currentPlayerCount)",
  "event GameFull(bytes32 indexed gameId, uint256 totalPool)",
  "event PrizeDistributed(bytes32 indexed gameId, address winner, uint256 winnerAmount, address firstRunner, uint256 firstRunnerAmount, address secondRunner, uint256 secondRunnerAmount, address lastPlace, uint256 lastPlaceAmount, uint256 platformFee)",
  "event PrizeTransferFailed(bytes32 indexed gameId, address indexed player, uint256 amount, string reason)",
  "event GameCancelled(bytes32 indexed gameId, uint256 totalAmount, string reason)",
  "event EmergencyWithdrawal(bytes32 indexed gameId, uint256 amount, string reason)",
  "event PrizeClaimed(bytes32 indexed gameId, address indexed player, uint256 amount)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
];

// Create provider and contract instances
const provider = new ethers.JsonRpcProvider(RPC_URL);
let contract: ethers.Contract | null = null;

// Initialize contract
(async () => {
  try {
    console.log('\n🔗 Initializing Celo Smart Contract Connection...');
    console.log(`🌐 Network Mode: ${USE_TESTNET ? 'TESTNET (Alfajores)' : 'MAINNET'}`);
    console.log(`📍 Contract Address: ${CONTRACT_ADDRESS || 'NOT SET'}`);
    console.log(`🌐 RPC URL: ${RPC_URL}`);

    if (!OWNER_PRIVATE_KEY) {
      console.warn('⚠️  PRIVATE_KEY not found in environment variables');
      console.warn('⚠️  Contract functions will not be available');
      return;
    }

    if (!CONTRACT_ADDRESS) {
      console.warn('⚠️  CONTRACT_ADDRESS not found in environment variables');
      console.warn('⚠️  Please deploy contract and set CELO_MAINNET_CONTRACT_ADDRESS');
      return;
    }

    const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    console.log(`👛 Wallet Address: ${ownerWallet.address}`);

    // Test RPC connection
    const network = await provider.getNetwork();
    console.log(`✅ Connected to Celo - Chain ID: ${network.chainId}`);

    // Verify we're on Celo
    if (!USE_TESTNET && network.chainId !== 42220n) {
      console.error(`❌ ERROR: Expected Celo Mainnet (42220) but connected to chain ${network.chainId}`);
      process.exit(1);
    }

    // Get wallet balance
    const balance = await provider.getBalance(ownerWallet.address);
    console.log(`💰 Wallet Balance: ${ethers.formatEther(balance)} CELO`);

    // Initialize contract
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ownerWallet);

    // Verify contract connection
    try {
      const entryFee = await contract.ENTRY_FEE();
      console.log(`💵 Entry Fee: ${ethers.formatEther(entryFee)} CELO`);

      // Get prize distribution
      const [winner, first, second, last, fee] = await contract.getPrizeDistribution();
      console.log('🏆 Prize Distribution:');
      console.log(`   Winner: ${ethers.formatEther(winner)} CELO (50%)`);
      console.log(`   1st Runner: ${ethers.formatEther(first)} CELO (25%)`);
      console.log(`   2nd Runner: ${ethers.formatEther(second)} CELO (12.5%)`);
      console.log(`   Last Place: ${ethers.formatEther(last)} CELO (6.25%)`);
      console.log(`   Platform Fee: ${ethers.formatEther(fee)} CELO (6.25%)`);

      console.log('✅ Smart Contract initialized successfully!\n');
    } catch (error: any) {
      console.error('❌ Contract verification failed:', error.message);
      console.error('⚠️  Contract may not be deployed at this address');
    }

  } catch (error: any) {
    console.error('❌ Failed to initialize contract:', error.message);
    console.error('⚠️  Game will continue without blockchain integration\n');
  }
})();

// Fallback initialization
if (OWNER_PRIVATE_KEY && CONTRACT_ADDRESS && !contract) {
  const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ownerWallet);
}

// Helper function to convert gameId string to bytes32
export function gameIdToBytes32(gameId: string): string {
  return ethers.id(gameId);
}

// ============ CONTRACT FUNCTIONS ============

/**
 * Check if a player has deposited for a game
 */
export async function hasPlayerDeposited(
  gameId: string,
  playerAddress: string
): Promise<boolean> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);
    const result = await contract.hasPlayerDeposited(gameIdBytes32, playerAddress);

    return result as boolean;
  } catch (error) {
    console.error("Error checking deposit status:", error);
    return false;
  }
}

/**
 * Distribute prizes to players based on rankings
 * @param gameId Game ID
 * @param rankedPlayers Array of [winner, 1st runner, 2nd runner, last place]
 */
export async function distributePrizes(
  gameId: string,
  rankedPlayers: [string, string, string, string]
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    console.log(`\n💰 Distributing prizes for game ${gameId}...`);
    console.log(`Winner: ${rankedPlayers[0]}`);
    console.log(`1st Runner: ${rankedPlayers[1]}`);
    console.log(`2nd Runner: ${rankedPlayers[2]}`);
    console.log(`Last Place: ${rankedPlayers[3]}`);

    const gameIdBytes32 = gameIdToBytes32(gameId);

    // Send transaction
    const tx = await contract.prizeWithdrawal(gameIdBytes32, rankedPlayers);
    console.log(`📤 Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    return {
      success: true,
      transactionHash: receipt.hash,
    };
  } catch (error: any) {
    console.error("❌ Error distributing prizes:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Cancel a game and send funds to owner for manual review
 * @param gameId Game ID
 * @param reason Cancellation reason
 */
export async function cancelGame(
  gameId: string,
  reason: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    console.log(`\n🚫 Cancelling game ${gameId}...`);
    console.log(`Reason: ${reason}`);

    const gameIdBytes32 = gameIdToBytes32(gameId);
    const tx = await contract.cancelGame(gameIdBytes32, reason);

    console.log(`📤 Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Game cancelled. Funds sent to owner for manual review.`);

    return {
      success: true,
      transactionHash: receipt.hash,
    };
  } catch (error: any) {
    console.error("❌ Error cancelling game:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Emergency withdrawal - send all game funds to owner
 * @param gameId Game ID
 * @param reason Emergency reason
 */
export async function emergencyWithdraw(
  gameId: string,
  reason: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    console.log(`\n🆘 Emergency withdrawal for game ${gameId}...`);
    console.log(`Reason: ${reason}`);

    const gameIdBytes32 = gameIdToBytes32(gameId);
    const tx = await contract.emergencyWithdraw(gameIdBytes32, reason);

    console.log(`📤 Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Emergency withdrawal completed. Review logs and refund players manually.`);

    return {
      success: true,
      transactionHash: receipt.hash,
    };
  } catch (error: any) {
    console.error("❌ Error in emergency withdrawal:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get game details
 */
export async function getGameDetails(gameId: string): Promise<{
  players: string[];
  poolAmount: bigint;
  isCompleted: boolean;
  isCancelled: boolean;
} | null> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);
    const [players, poolAmount, isCompleted, isCancelled] = await contract.getGameDetails(gameIdBytes32);

    return {
      players,
      poolAmount,
      isCompleted,
      isCancelled,
    };
  } catch (error) {
    console.error("Error getting game details:", error);
    return null;
  }
}

/**
 * Get player count for a game
 */
export async function getPlayerCount(gameId: string): Promise<number> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);
    const count = await contract.getPlayerCount(gameIdBytes32);

    return Number(count);
  } catch (error) {
    console.error("Error getting player count:", error);
    return 0;
  }
}

/**
 * Get unclaimed prize for a player
 */
export async function getUnclaimedPrize(
  gameId: string,
  playerAddress: string
): Promise<bigint> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);
    const amount = await contract.getUnclaimedPrize(gameIdBytes32, playerAddress);

    return amount;
  } catch (error) {
    console.error("Error getting unclaimed prize:", error);
    return 0n;
  }
}

export { contract, provider };
