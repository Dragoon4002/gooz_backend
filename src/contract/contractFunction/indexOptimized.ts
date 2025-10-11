import { ethers } from "ethers";
import { config } from "dotenv";

config();

// Contract details
const CONTRACT_ADDRESS = process.env.FINAL_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS || "";
const RPC_URL = process.env.RPC_URL || "https://rpc-nebulas-testnet.u2u.xyz";
const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract ABI for finalContractOptimized.sol
const CONTRACT_ABI = [
  // Write Functions
  "function playerDeposit(bytes32 _gameId, address _playerAddress) external payable",
  "function prizeWithdrawal(bytes32 _gameId, address[4] memory _rankedPlayers) external",
  "function emergencyWithdraw(bytes32 _gameId) external",
  "function setCreatorWallet(address _newCreatorWallet) external",
  "function transferOwnership(address _newOwner) external",

  // View Functions
  "function getGameDetails(bytes32 _gameId) external view returns (address[] memory players, uint256 poolAmount, bool isCompleted, bool hasTransferred)",
  "function getPlayers(bytes32 _gameId) external view returns (address[] memory)",
  "function getPlayerCount(bytes32 _gameId) external view returns (uint256)",
  "function getPoolAmount(bytes32 _gameId) external view returns (uint256)",
  "function isGameCompleted(bytes32 _gameId) external view returns (bool)",
  "function hasPrizesTransferred(bytes32 _gameId) external view returns (bool)",
  "function hasPlayerDeposited(bytes32 _gameId, address _player) external view returns (bool)",
  "function getContractBalance() external view returns (uint256)",
  "function getCreatorWallet() external view returns (address)",

  // Public Variables
  "function owner() external view returns (address)",
  "function creatorWallet() external view returns (address)",
  "function ENTRY_FEE() external view returns (uint256)",
  "function TOTAL_PLAYERS() external view returns (uint256)",

  // Events
  "event PlayerDeposited(bytes32 indexed gameId, address indexed player, uint256 amount, uint256 currentPlayerCount)",
  "event GameFull(bytes32 indexed gameId, uint256 totalPool)",
  "event PrizeDistributed(bytes32 indexed gameId, address winner, uint256 winnerAmount, address firstRunner, uint256 firstRunnerAmount, address secondRunner, uint256 secondRunnerAmount, address lastPlayer, uint256 lastPlayerAmount, uint256 remainderToCreator)",
  "event EmergencyWithdrawal(bytes32 indexed gameId, address indexed recipient, uint256 amount)",
  "event CreatorWalletUpdated(address indexed oldWallet, address indexed newWallet)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
];

// Create provider and contract instances
const provider = new ethers.JsonRpcProvider(RPC_URL);
let contract: ethers.Contract | null = null;

if (OWNER_PRIVATE_KEY) {
  const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ownerWallet);
}

// ============ TYPES ============

interface DepositResult {
  success: boolean;
  transactionHash: string;
  blockNumber: number;
  playerAddress: string;
  gameId: string;
  playerCount: number;
}

interface PrizeWithdrawalResult {
  success: boolean;
  transactionHash: string;
  blockNumber: number;
  gameId: string;
  remainderToCreator: bigint;
  distributionDetails?: {
    winner: { address: string; amount: bigint };
    firstRunner: { address: string; amount: bigint };
    secondRunner: { address: string; amount: bigint };
    loser: { address: string; amount: bigint };
  };
}

interface GameDetails {
  players: string[];
  poolAmount: bigint;
  isCompleted: boolean;
  hasTransferred: boolean;
}

interface EmergencyWithdrawResult {
  success: boolean;
  transactionHash: string;
  blockNumber: number;
  amount: bigint;
}

// ============ HELPER FUNCTIONS ============

/**
 * Convert string gameId to bytes32 for contract interaction
 * @param gameId - String game ID
 * @returns bytes32 hex string
 */
function gameIdToBytes32(gameId: string): string {
  return ethers.id(gameId);
}

/**
 * Format U2U amount for display
 * @param amount - Amount in wei
 * @returns Formatted string
 */
function formatU2U(amount: bigint): string {
  return ethers.formatEther(amount);
}

// ============ MAIN FUNCTIONS ============

/**
 * Deposit entry fee for a player into escrow
 * @param gameId - The game ID (string)
 * @param playerAddress - Player's public wallet address
 * @returns Deposit transaction result
 */
export async function playerDeposit(gameId: string, playerAddress: string): Promise<DepositResult> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    // Convert gameId to bytes32
    const gameIdBytes32 = gameIdToBytes32(gameId);

    // Get entry fee
    const entryFee = await contract.ENTRY_FEE();

    console.log(`💰 Depositing for player ${playerAddress} in game ${gameId}...`);
    console.log(`   GameId (bytes32): ${gameIdBytes32}`);
    console.log(`   Entry Fee: ${formatU2U(entryFee)} U2U`);

    // Check if player already deposited
    const hasDeposited = await contract.hasPlayerDeposited(gameIdBytes32, playerAddress);
    if (hasDeposited) {
      throw new Error("Player already deposited for this game");
    }

    // Owner signs transaction, player address is recorded as depositor
    const tx = await contract.playerDeposit(gameIdBytes32, playerAddress, {
      value: entryFee
    });

    console.log(`   Transaction sent: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);

    const receipt = await tx.wait();

    // Get updated player count
    const playerCount = await contract.getPlayerCount(gameIdBytes32);

    console.log(`   ✅ Deposit successful! Block: ${receipt.blockNumber}`);
    console.log(`   📊 Players in game: ${playerCount}/4\n`);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      playerAddress: playerAddress,
      gameId,
      playerCount: Number(playerCount)
    };
  } catch (error: any) {
    console.error("❌ Error in player deposit:", error.message);
    throw error;
  }
}

/**
 * Distribute prizes after game ends (only owner can call)
 * @param gameId - The game ID (string)
 * @param rankedPlayers - Array of 4 player addresses [winner, 1st runner, 2nd runner, loser]
 * @returns Prize withdrawal result with distribution details
 */
export async function prizeWithdrawal(
  gameId: string,
  rankedPlayers: [string, string, string, string]
): Promise<PrizeWithdrawalResult> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    if (rankedPlayers.length !== 4) {
      throw new Error("Must provide exactly 4 player addresses in rank order");
    }

    // Convert gameId to bytes32
    const gameIdBytes32 = gameIdToBytes32(gameId);

    console.log(`\n🏆 Distributing prizes for game ${gameId}...`);
    console.log(`   GameId (bytes32): ${gameIdBytes32}`);
    console.log(`   Winner:       ${rankedPlayers[0]}`);
    console.log(`   1st Runner:   ${rankedPlayers[1]}`);
    console.log(`   2nd Runner:   ${rankedPlayers[2]}`);
    console.log(`   Loser:        ${rankedPlayers[3]}`);
    console.log(`\n   Prize Distribution:`);
    console.log(`   • Winner:      20 U2U (2x Entry Fee)`);
    console.log(`   • 1st Runner:  10 U2U (1x Entry Fee)`);
    console.log(`   • 2nd Runner:   5 U2U (0.5x Entry Fee)`);
    console.log(`   • Loser:        0 U2U`);
    console.log(`   • Creator:     ~5 U2U (Remainder)\n`);

    // Verify game is ready for distribution
    const details = await getGameDetails(gameId);
    if (details.hasTransferred) {
      throw new Error("Prizes already transferred for this game");
    }
    if (details.players.length !== 4) {
      throw new Error(`Game not full. Current players: ${details.players.length}/4`);
    }

    // Send transaction
    const tx = await contract.prizeWithdrawal(gameIdBytes32, rankedPlayers);

    console.log(`   Transaction sent: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);

    const receipt = await tx.wait();

    console.log(`   ✅ Prizes distributed successfully! Block: ${receipt.blockNumber}`);

    // Parse event to get distribution details
    let remainderToCreator = BigInt(0);
    let distributionDetails;

    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog({
            topics: [...log.topics],
            data: log.data
          });

          if (parsedLog && parsedLog.name === 'PrizeDistributed') {
            remainderToCreator = parsedLog.args.remainderToCreator;

            distributionDetails = {
              winner: {
                address: parsedLog.args.winner,
                amount: parsedLog.args.winnerAmount
              },
              firstRunner: {
                address: parsedLog.args.firstRunner,
                amount: parsedLog.args.firstRunnerAmount
              },
              secondRunner: {
                address: parsedLog.args.secondRunner,
                amount: parsedLog.args.secondRunnerAmount
              },
              loser: {
                address: parsedLog.args.lastPlayer,
                amount: parsedLog.args.lastPlayerAmount
              }
            };

            console.log(`\n   📊 Distribution Summary:`);
            console.log(`   Winner received:      ${formatU2U(distributionDetails.winner.amount)} U2U`);
            console.log(`   1st Runner received:  ${formatU2U(distributionDetails.firstRunner.amount)} U2U`);
            console.log(`   2nd Runner received:  ${formatU2U(distributionDetails.secondRunner.amount)} U2U`);
            console.log(`   Loser received:       ${formatU2U(distributionDetails.loser.amount)} U2U`);
            console.log(`   💰 Creator received:   ${formatU2U(remainderToCreator)} U2U\n`);

            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
        }
      }
    }

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gameId,
      remainderToCreator,
      distributionDetails
    };
  } catch (error: any) {
    console.error("❌ Error distributing prizes:", error.message);
    throw error;
  }
}

/**
 * Emergency withdrawal for a specific game
 * @param gameId - The game ID (string)
 * @returns Transaction result
 */
export async function emergencyWithdraw(gameId: string): Promise<EmergencyWithdrawResult> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);

    console.log(`⚠️  Emergency withdrawal for game ${gameId}...`);

    // Get game details first
    const details = await getGameDetails(gameId);
    console.log(`   Amount to withdraw: ${formatU2U(details.poolAmount)} U2U`);

    const tx = await contract.emergencyWithdraw(gameIdBytes32);

    console.log(`   Transaction sent: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);

    const receipt = await tx.wait();

    console.log(`   ✅ Emergency withdrawal successful! Block: ${receipt.blockNumber}\n`);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      amount: details.poolAmount
    };
  } catch (error: any) {
    console.error("❌ Error in emergency withdrawal:", error.message);
    throw error;
  }
}

/**
 * Get game details
 * @param gameId - The game ID (string)
 * @returns Game details
 */
export async function getGameDetails(gameId: string): Promise<GameDetails> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);
    const details = await contract.getGameDetails(gameIdBytes32);

    return {
      players: details[0],
      poolAmount: details[1],
      isCompleted: details[2],
      hasTransferred: details[3]
    };
  } catch (error: any) {
    console.error("❌ Error getting game details:", error.message);
    throw error;
  }
}

/**
 * Check if a player has deposited for a game
 * @param gameId - The game ID (string)
 * @param playerAddress - Player's wallet address
 * @returns True if player has deposited
 */
export async function hasPlayerDeposited(gameId: string, playerAddress: string): Promise<boolean> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);
    return await contract.hasPlayerDeposited(gameIdBytes32, playerAddress);
  } catch (error: any) {
    console.error("❌ Error checking player deposit:", error.message);
    return false;
  }
}

/**
 * Set creator wallet address
 * @param newCreatorWallet - New creator wallet address
 * @returns Transaction result
 */
export async function setCreatorWallet(newCreatorWallet: string): Promise<{ success: boolean; transactionHash: string; blockNumber: number }> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    console.log(`🔄 Updating creator wallet to ${newCreatorWallet}...`);

    const tx = await contract.setCreatorWallet(newCreatorWallet);

    console.log(`   Transaction sent: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);

    const receipt = await tx.wait();

    console.log(`   ✅ Creator wallet updated! Block: ${receipt.blockNumber}\n`);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error: any) {
    console.error("❌ Error updating creator wallet:", error.message);
    throw error;
  }
}

/**
 * Get creator wallet address
 * @returns Creator wallet address
 */
export async function getCreatorWallet(): Promise<string> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    return await contract.getCreatorWallet();
  } catch (error: any) {
    console.error("❌ Error getting creator wallet:", error.message);
    throw error;
  }
}

/**
 * Get contract owner address
 * @returns Owner address
 */
export async function getOwner(): Promise<string> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    return await contract.owner();
  } catch (error: any) {
    console.error("❌ Error getting owner:", error.message);
    throw error;
  }
}

/**
 * Get contract balance
 * @returns Contract balance in wei
 */
export async function getContractBalance(): Promise<bigint> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    return await contract.getContractBalance();
  } catch (error: any) {
    console.error("❌ Error getting contract balance:", error.message);
    throw error;
  }
}

/**
 * Get entry fee amount
 * @returns Entry fee in wei
 */
export async function getEntryFee(): Promise<bigint> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    return await contract.ENTRY_FEE();
  } catch (error: any) {
    console.error("❌ Error getting entry fee:", error.message);
    throw error;
  }
}

// ============ LEGACY COMPATIBILITY ============

/**
 * Legacy hasPaidStake function for backward compatibility
 * @deprecated Use hasPlayerDeposited instead
 */
export const hasPaidStake = (playerId: string, stakeAmount: string) => {
  if (!playerId || !stakeAmount) {
    return false;
  }
  // In the new contract, deposits are verified on-chain
  // This function is kept for backward compatibility
  return true;
};

// ============ EXPORTS ============

export {
  gameIdToBytes32,
  formatU2U,
  CONTRACT_ADDRESS,
  RPC_URL
};

export default {
  playerDeposit,
  prizeWithdrawal,
  emergencyWithdraw,
  getGameDetails,
  hasPlayerDeposited,
  setCreatorWallet,
  getCreatorWallet,
  getOwner,
  getContractBalance,
  getEntryFee,
  hasPaidStake
};
