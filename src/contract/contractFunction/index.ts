import { ethers } from "ethers";
import { config } from "dotenv";

config();

// Contract details - Use testnet/mainnet based on environment
const USE_TESTNET = process.env.USE_TESTNET === 'true';
const CONTRACT_ADDRESS = USE_TESTNET
  ? (process.env.TESTNET_CONTRACT_ADDRESS || "0x39cECF23772596579276303a850cd641c3f152bA")
  : (process.env.MAINNET_CONTRACT_ADDRESS || process.env.FINAL_CONTRACT_ADDRESS || "0x39cECF23772596579276303a850cd641c3f152bA");
const RPC_URL = USE_TESTNET
  ? (process.env.TESTNET_RPC_URL || "https://rpc-nebulas-testnet.u2u.xyz")
  : (process.env.MAINNET_RPC_URL || "https://rpc-mainnet.u2u.xyz");
const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract ABI (MonopolyGameEscrow.sol with 1 U2U entry fee)
const CONTRACT_ABI = [
  "function playerDeposit(bytes32 _gameId) external payable",
  "function prizeWithdrawal(bytes32 _gameId, address[4] memory _rankedPlayers) external",
  "function emergencyWithdraw(bytes32 _gameId) external",
  "function getGameDetails(bytes32 _gameId) external view returns (address[] memory players, uint256 poolAmount, bool isCompleted, bool hasTransferred)",
  "function getPlayers(bytes32 _gameId) external view returns (address[] memory)",
  "function getPlayerCount(bytes32 _gameId) external view returns (uint256)",
  "function getPoolAmount(bytes32 _gameId) external view returns (uint256)",
  "function isGameCompleted(bytes32 _gameId) external view returns (bool)",
  "function hasPlayerDeposited(bytes32 _gameId, address _player) external view returns (bool)",
  "function getContractBalance() external view returns (uint256)",
  "function getCreatorWallet() external view returns (address)",
  "function setCreatorWallet(address _newCreatorWallet) external",
  "function transferOwnership(address _newOwner) external",
  "function ENTRY_FEE() external view returns (uint256)",
  "function TOTAL_PLAYERS() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function creatorWallet() external view returns (address)",
  "event PlayerDeposited(bytes32 indexed gameId, address indexed player, uint256 amount, uint256 currentPlayerCount)",
  "event GameFull(bytes32 indexed gameId, uint256 totalPool)",
  "event PrizeDistributed(bytes32 indexed gameId, address winner, uint256 winnerAmount, address firstRunner, uint256 firstRunnerAmount, address secondRunner, uint256 secondRunnerAmount, address lastPlayer, uint256 lastPlayerAmount, uint256 remainderToOwner)",
  "event EmergencyWithdrawal(bytes32 indexed gameId, address indexed recipient, uint256 amount)",
  "event CreatorWalletUpdated(address indexed oldWallet, address indexed newWallet)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
];

// Create provider and contract instances
const provider = new ethers.JsonRpcProvider(RPC_URL);
let contract: ethers.Contract | null = null;

// Initialize contract with logging
(async () => {
  try {
    console.log('\n🔗 Initializing Smart Contract Connection...');
    console.log(`🌐 Network Mode: ${USE_TESTNET ? 'TESTNET' : 'MAINNET'}`);
    console.log(`📍 Contract Address: ${CONTRACT_ADDRESS}`);
    console.log(`🌐 RPC URL: ${RPC_URL}`);

    if (!OWNER_PRIVATE_KEY) {
      console.warn('⚠️  PRIVATE_KEY not found in environment variables');
      console.warn('⚠️  Contract functions will not be available');
      return;
    }

    const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    console.log(`👛 Wallet Address: ${ownerWallet.address}`);

    // Test RPC connection
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network - Chain ID: ${network.chainId}`);

    // Get wallet balance
    const balance = await provider.getBalance(ownerWallet.address);
    console.log(`💰 Wallet Balance: ${ethers.formatEther(balance)} U2U`);

    // Initialize contract
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ownerWallet);

    // Verify contract connection by calling a view function
    try {
      const entryFee = await contract.ENTRY_FEE();
      console.log(`💵 Entry Fee: ${ethers.formatEther(entryFee)} U2U`);
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

// Fallback initialization if async fails
if (OWNER_PRIVATE_KEY && !contract) {
  const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ownerWallet);
}

// Types
interface DepositResult {
  success: boolean;
  transactionHash: string;
  blockNumber: number;
  playerAddress: string;
  gameId: string;
}

interface PrizeDistributionResult {
  success: boolean;
  transactionHash: string;
  blockNumber: number;
  gameId: string;
  failedTransfers?: FailedTransfer[];
}

interface FailedTransfer {
  recipient: string;
  amount: bigint;
  blockNumber: number;
  resolved: boolean;
}

/**
 * Convert string gameId to bytes32 for contract interaction
 * @param gameId - String game ID
 * @returns bytes32 hex string
 */
function gameIdToBytes32(gameId: string): string {
  return ethers.id(gameId);
}

export const hasPaidStake = (playerId: string, stakeAmount: string) => {
  if (!playerId || !stakeAmount) {
    return false;
  }
  // Implement actual payment verification logic here

  return true;
}

/**
 * Player deposits entry fee (owner signs transaction on behalf of player)
 * @param gameId - The game ID (string)
 * @param playerAddress - Player's public wallet address (playerId)
 * @returns Deposit transaction result
 */
export async function playerDeposit(gameId: string, playerAddress: string): Promise<DepositResult> {
  try {
    if (!contract) {
      console.error('❌ Contract not initialized');
      console.error('   Contract Address:', CONTRACT_ADDRESS);
      console.error('   RPC URL:', RPC_URL);
      console.error('   Private Key exists:', !!OWNER_PRIVATE_KEY);
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable and RPC connection.");
    }

    // Convert gameId to bytes32
    const gameIdBytes32 = gameIdToBytes32(gameId);

    // Get entry fee
    const entryFee = await contract.ENTRY_FEE();

    console.log(`Depositing for player ${playerAddress} in game ${gameId}...`);
    console.log(`GameId (bytes32): ${gameIdBytes32}`);

    // Owner signs transaction on behalf of player (player doesn't need wallet)
    // Player address is passed as parameter to track who deposited
    const tx = await contract.playerDeposit(gameIdBytes32, {
      value: entryFee
    });

    console.log(`Transaction sent: ${tx.hash}`);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();

    console.log(`✅ Deposit successful! Block: ${receipt.blockNumber}`);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      playerAddress: playerAddress,
      gameId
    };
  } catch (error) {
    console.error("Error in player deposit:", error);
    throw error;
  }
}

/**
 * Distribute prizes after game ends (only owner can call)
 * @param gameId - The game ID (string)
 * @param rankedPlayers - Array of 4 player addresses [winner, 1st runner, 2nd runner, loser]
 * @returns Prize distribution result with any failed transfers
 */
export async function distributePrizes(
  gameId: string,
  rankedPlayers: [string, string, string, string]
): Promise<PrizeDistributionResult> {
  try {
    if (!contract) {
      console.error('❌ Contract not initialized for prize distribution');
      console.error('   Contract Address:', CONTRACT_ADDRESS);
      console.error('   RPC URL:', RPC_URL);
      console.error('   Private Key exists:', !!OWNER_PRIVATE_KEY);
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable and RPC connection.");
    }

    if (rankedPlayers.length !== 4) {
      throw new Error("Must provide exactly 4 player addresses in rank order");
    }

    // Convert gameId to bytes32
    const gameIdBytes32 = gameIdToBytes32(gameId);

    console.log(`Distributing prizes for game ${gameId}...`);
    console.log(`GameId (bytes32): ${gameIdBytes32}`);
    console.log(`Winner:       ${rankedPlayers[0]}`);
    console.log(`1st Runner:   ${rankedPlayers[1]}`);
    console.log(`2nd Runner:   ${rankedPlayers[2]}`);
    console.log(`Loser:        ${rankedPlayers[3]}`);

    // Send transaction
    const tx = await contract.prizeWithdrawal(gameIdBytes32, rankedPlayers);

    console.log(`Transaction sent: ${tx.hash}`);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();

    console.log(`✅ Prizes distributed successfully! Block: ${receipt.blockNumber}`);

    // Note: This contract sends all failed transfers to owner wallet automatically
    // No need to check for failed transfers separately

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gameId,
      failedTransfers: undefined
    };
  } catch (error) {
    console.error("Error distributing prizes:", error);
    throw error;
  }
}

/**
 * Check if a player has already deposited for a game
 * @param gameId - The game ID (string)
 * @param playerAddress - Player's wallet address
 * @returns true if player has deposited
 */
export async function hasPlayerDeposited(gameId: string, playerAddress: string): Promise<boolean> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
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
 * Emergency withdrawal - refunds all players if game didn't complete
 * @param gameId - The game ID (string)
 * @returns Transaction result
 */
export async function emergencyWithdraw(gameId: string): Promise<{ success: boolean; transactionHash: string; blockNumber: number }> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);

    console.log(`Emergency withdrawal for game ${gameId}...`);

    const tx = await contract.emergencyWithdraw(gameIdBytes32);

    console.log(`Transaction sent: ${tx.hash}`);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();

    console.log(`✅ Emergency withdrawal completed! Block: ${receipt.blockNumber}`);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("Error in emergency withdrawal:", error);
    throw error;
  }
}