import { ethers } from "ethers";
import { config } from "dotenv";

config();

// Contract details
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x2D1524FFE7bB9d6876763650a5FDD60f2e59229d";
const RPC_URL = process.env.RPC_URL || "https://rpc-nebulas-testnet.u2u.xyz";
const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract ABI (updated for MonopolyGameEscrow.sol with bytes32 gameId)
const CONTRACT_ABI = [
  "function playerDeposit(bytes32 _gameId) external payable",
  "function prizeWithdrawal(bytes32 _gameId, address[4] memory _rankedPlayers) external",
  "function emergencyWithdraw(bytes32 _gameId) external",
  "function getGameDetails(bytes32 _gameId) external view returns (address[4] memory players, bool isCompleted, bool remainderWithdrawn)",
  "function getFailedTransfers(bytes32 _gameId) external view returns (tuple(address recipient, uint256 amount, uint256 blockNumber, bool resolved)[] memory)",
  "function getUnresolvedFailedTransfers(bytes32 _gameId) external view returns (tuple(address recipient, uint256 amount, uint256 blockNumber, bool resolved)[] memory)",
  "function markFailedTransferResolved(bytes32 _gameId, uint256 _failedTransferIndex) external",
  "function ENTRY_FEE() external view returns (uint256)",
  "function mammaWallet() external view returns (address)",
  "event PlayerDeposited(bytes32 indexed gameId, address indexed player, uint256 amount)",
  "event GameStarted(bytes32 indexed gameId, address[4] players)",
  "event PrizeDistributed(bytes32 indexed gameId, address indexed winner, address indexed firstRunner, address secondRunner, address loser)",
  "event TransferFailed(bytes32 indexed gameId, address indexed recipient, uint256 amount, uint256 blockNumber, uint256 failedTransferIndex)",
  "event FailedTransferResolved(bytes32 indexed gameId, address indexed recipient, uint256 amount, uint256 failedTransferIndex)",
  "event RemainderWithdrawn(bytes32 indexed gameId, uint256 amount)"
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
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
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
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
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

    // Check for any failed transfers
    const failedTransfers = await getUnresolvedFailedTransfers(gameId);

    if (failedTransfers.length > 0) {
      console.warn(`⚠️  ${failedTransfers.length} transfer(s) failed. Manual resolution required.`);
      failedTransfers.forEach((ft, idx) => {
        console.warn(`   [${idx}] ${ft.recipient}: ${ethers.formatEther(ft.amount)} U2U (Block: ${ft.blockNumber})`);
      });
    }

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gameId,
      failedTransfers: failedTransfers.length > 0 ? failedTransfers : undefined
    };
  } catch (error) {
    console.error("Error distributing prizes:", error);
    throw error;
  }
}

/**
 * Get unresolved failed transfers for a game
 * @param gameId - The game ID (string)
 * @returns Array of failed transfers that need manual resolution
 */
export async function getUnresolvedFailedTransfers(gameId: string): Promise<FailedTransfer[]> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);
    const failedTransfers = await contract.getUnresolvedFailedTransfers(gameIdBytes32);

    return failedTransfers.map((ft: any) => ({
      recipient: ft.recipient,
      amount: ft.amount,
      blockNumber: Number(ft.blockNumber),
      resolved: ft.resolved
    }));
  } catch (error) {
    console.error("Error getting failed transfers:", error);
    return [];
  }
}

/**
 * Withdraw 5 U2U remainder to mammaWallet after game completion
 * @param gameId - The game ID (string)
 * @returns Transaction result
 */
export async function returnToMamma(gameId: string): Promise<{ success: boolean; transactionHash: string; blockNumber: number }> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);

    console.log(`Withdrawing remainder for game ${gameId} to mammaWallet...`);

    const tx = await contract.returnToMamma(gameIdBytes32);

    console.log(`Transaction sent: ${tx.hash}`);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();

    console.log(`✅ Remainder withdrawn successfully! Block: ${receipt.blockNumber}`);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("Error withdrawing remainder:", error);
    throw error;
  }
}

/**
 * Mark a failed transfer as resolved after manual payment from mammaWallet
 * @param gameId - The game ID (string)
 * @param failedTransferIndex - Index of the failed transfer
 * @returns Transaction result
 */
export async function markFailedTransferResolved(
  gameId: string,
  failedTransferIndex: number
): Promise<{ success: boolean; transactionHash: string; blockNumber: number }> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);

    console.log(`Marking failed transfer ${failedTransferIndex} as resolved for game ${gameId}...`);

    const tx = await contract.markFailedTransferResolved(gameIdBytes32, failedTransferIndex);

    console.log(`Transaction sent: ${tx.hash}`);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();

    console.log(`✅ Failed transfer marked as resolved! Block: ${receipt.blockNumber}`);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("Error marking transfer as resolved:", error);
    throw error;
  }
}