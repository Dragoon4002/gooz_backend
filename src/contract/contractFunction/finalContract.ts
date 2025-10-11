import { ethers } from "ethers";
import { config } from "dotenv";

config();

// Contract details
const CONTRACT_ADDRESS = process.env.FINAL_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS || "";
const RPC_URL = process.env.RPC_URL || "https://rpc-nebulas-testnet.u2u.xyz";
const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract ABI for finalContract.sol
const CONTRACT_ABI = [
  "function playerDeposit(bytes32 _gameId, address _playerAddress) external payable",
  "function prizeWithdrawal(bytes32 _gameId, address[4] memory _rankedPlayers) external",
  "function emergencyWithdraw(bytes32 _gameId) external",
  "function setCreatorWallet(address _newCreatorWallet) external",
  "function getGameDetails(bytes32 _gameId) external view returns (address[] memory players, uint256 poolAmount, bool isCompleted, bool hasTransferred)",
  "function getPlayers(bytes32 _gameId) external view returns (address[] memory)",
  "function getPlayerCount(bytes32 _gameId) external view returns (uint256)",
  "function getPoolAmount(bytes32 _gameId) external view returns (uint256)",
  "function isGameCompleted(bytes32 _gameId) external view returns (bool)",
  "function hasPrizesTransferred(bytes32 _gameId) external view returns (bool)",
  "function getContractBalance() external view returns (uint256)",
  "function getCreatorWallet() external view returns (address)",
  "function transferOwnership(address _newOwner) external",
  "function ENTRY_FEE() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function creatorWallet() external view returns (address)",
  "event PlayerDeposited(bytes32 indexed gameId, address indexed player, uint256 amount, uint256 currentPlayerCount)",
  "event GameFull(bytes32 indexed gameId, uint256 totalPool)",
  "event PrizeDistributed(bytes32 indexed gameId, address winner, uint256 winnerAmount, address firstRunner, uint256 firstRunnerAmount, address secondRunner, uint256 secondRunnerAmount, address lastPlayer, uint256 lastPlayerAmount, uint256 remainderToCreator)",
  "event EmergencyWithdrawal(bytes32 indexed gameId, address indexed recipient, uint256 amount)",
  "event CreatorWalletUpdated(address indexed oldWallet, address indexed newWallet)"
];

// Create provider and contract instances
const provider = new ethers.JsonRpcProvider(RPC_URL);
let contract: ethers.Contract | null = null;

if (OWNER_PRIVATE_KEY) {
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

interface PrizeWithdrawalResult {
  success: boolean;
  transactionHash: string;
  blockNumber: number;
  gameId: string;
  remainderToCreator: bigint;
}

interface GameDetails {
  players: string[];
  poolAmount: bigint;
  isCompleted: boolean;
  hasTransferred: boolean;
}

/**
 * Convert string gameId to bytes32 for contract interaction
 * @param gameId - String game ID
 * @returns bytes32 hex string
 */
function gameIdToBytes32(gameId: string): string {
  return ethers.id(gameId);
}

/**
 * Player deposits entry fee (owner signs transaction on behalf of player)
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

    // Owner signs transaction, player address is recorded as depositor
    const tx = await contract.playerDeposit(gameIdBytes32, playerAddress, {
      value: entryFee
    });

    console.log(`   Transaction sent: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);

    const receipt = await tx.wait();

    console.log(`   ✅ Deposit successful! Block: ${receipt.blockNumber}`);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      playerAddress: playerAddress,
      gameId
    };
  } catch (error) {
    console.error("❌ Error in player deposit:", error);
    throw error;
  }
}

/**
 * Distribute prizes after game ends
 * @param gameId - The game ID (string)
 * @param rankedPlayers - Array of 4 player addresses [winner, 1st runner, 2nd runner, loser]
 * @returns Prize withdrawal result
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

    // Send transaction
    const tx = await contract.prizeWithdrawal(gameIdBytes32, rankedPlayers);

    console.log(`   Transaction sent: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);

    const receipt = await tx.wait();

    console.log(`   ✅ Prizes distributed successfully! Block: ${receipt.blockNumber}`);

    // Parse event to get remainder amount sent to creator
    let remainderToCreator = BigInt(0);
    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog({ topics: [...log.topics], data: log.data });
          if (parsedLog && parsedLog.name === 'PrizeDistributed') {
            remainderToCreator = parsedLog.args.remainderToCreator;
            console.log(`   💰 Remainder sent to creator: ${ethers.formatEther(remainderToCreator)} U2U\n`);
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
      remainderToCreator
    };
  } catch (error) {
    console.error("❌ Error distributing prizes:", error);
    throw error;
  }
}

/**
 * Emergency withdrawal for a specific game
 * @param gameId - The game ID (string)
 * @returns Transaction result
 */
export async function emergencyWithdraw(gameId: string): Promise<{ success: boolean; transactionHash: string; blockNumber: number }> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);

    console.log(`⚠️  Emergency withdrawal for game ${gameId}...`);

    const tx = await contract.emergencyWithdraw(gameIdBytes32);

    console.log(`   Transaction sent: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);

    const receipt = await tx.wait();

    console.log(`   ✅ Emergency withdrawal successful! Block: ${receipt.blockNumber}`);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("❌ Error in emergency withdrawal:", error);
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
  } catch (error) {
    console.error("❌ Error getting game details:", error);
    throw error;
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

    console.log(`   ✅ Creator wallet updated! Block: ${receipt.blockNumber}`);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("❌ Error updating creator wallet:", error);
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
  } catch (error) {
    console.error("❌ Error getting creator wallet:", error);
    throw error;
  }
}
