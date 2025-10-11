import { ethers } from "ethers";
import { config } from "dotenv";

config();

const ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_creatorWallet",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldWallet",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newWallet",
        "type": "address"
      }
    ],
    "name": "CreatorWalletUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "gameId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "EmergencyWithdrawal",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "gameId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalPool",
        "type": "uint256"
      }
    ],
    "name": "GameFull",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "gameId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "currentPlayerCount",
        "type": "uint256"
      }
    ],
    "name": "PlayerDeposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "gameId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "winner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "winnerAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "firstRunner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "firstRunnerAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "secondRunner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "secondRunnerAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "lastPlayer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "lastPlayerAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "remainderToCreator",
        "type": "uint256"
      }
    ],
    "name": "PrizeDistributed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "ENTRY_FEE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TOTAL_PLAYERS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creatorWallet",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_gameId",
        "type": "bytes32"
      }
    ],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCreatorWallet",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_gameId",
        "type": "bytes32"
      }
    ],
    "name": "getGameDetails",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "players",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "poolAmount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isCompleted",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "hasTransferred",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_gameId",
        "type": "bytes32"
      }
    ],
    "name": "getPlayerCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_gameId",
        "type": "bytes32"
      }
    ],
    "name": "getPlayers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_gameId",
        "type": "bytes32"
      }
    ],
    "name": "getPoolAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_gameId",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "_player",
        "type": "address"
      }
    ],
    "name": "hasPlayerDeposited",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_gameId",
        "type": "bytes32"
      }
    ],
    "name": "hasPrizesTransferred",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_gameId",
        "type": "bytes32"
      }
    ],
    "name": "isGameCompleted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_gameId",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "_playerAddress",
        "type": "address"
      }
    ],
    "name": "playerDeposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_gameId",
        "type": "bytes32"
      },
      {
        "internalType": "address[4]",
        "name": "_rankedPlayers",
        "type": "address[4]"
      }
    ],
    "name": "prizeWithdrawal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_newCreatorWallet",
        "type": "address"
      }
    ],
    "name": "setCreatorWallet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = "0x39cECF23772596579276303a850cd641c3f152bA";
const RPC_URL = process.env.RPC_URL || "https://rpc-nebulas-testnet.u2u.xyz";
const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY;

// Create provider and contract instance
const provider = new ethers.JsonRpcProvider(RPC_URL);
let contract: ethers.Contract | null = null;

if (OWNER_PRIVATE_KEY) {
  const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, ownerWallet);
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
 */
function gameIdToBytes32(gameId: string): string {
  return ethers.id(gameId);
}

/**
 * Format U2U amount for display
 */
function formatU2U(amount: bigint): string {
  return ethers.formatEther(amount);
}

// ============ MAIN FUNCTIONS ============

/**
 * Deposit entry fee for a player into escrow
 */
export async function playerDeposit(gameId: string, playerAddress: string): Promise<DepositResult> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);
    const entryFee = await contract.ENTRY_FEE();

    console.log(`💰 Depositing for player ${playerAddress}...`);
    console.log(`   Game ID: ${gameId}`);
    console.log(`   Entry Fee: ${formatU2U(entryFee)} U2U`);

    const hasDeposited = await contract.hasPlayerDeposited(gameIdBytes32, playerAddress);
    if (hasDeposited) {
      throw new Error("Player already deposited for this game");
    }

    const tx = await contract.playerDeposit(gameIdBytes32, playerAddress, {
      value: entryFee
    });

    console.log(`   📝 Transaction sent: ${tx.hash}`);
    console.log(`   ⏳ Waiting for confirmation...`);

    const receipt = await tx.wait();
    const playerCount = await contract.getPlayerCount(gameIdBytes32);

    console.log(`   ✅ Deposit successful! Block: ${receipt.blockNumber}`);
    console.log(`   👥 Players in game: ${playerCount}/4\n`);

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      playerAddress,
      gameId,
      playerCount: Number(playerCount)
    };
  } catch (error: any) {
    console.error("❌ Error in player deposit:", error.message);
    throw error;
  }
}

/**
 * Distribute prizes after game ends
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

    const gameIdBytes32 = gameIdToBytes32(gameId);

    console.log(`\n🏆 Distributing prizes for game ${gameId}...`);
    console.log(`   Winner:       ${rankedPlayers[0]}`);
    console.log(`   1st Runner:   ${rankedPlayers[1]}`);
    console.log(`   2nd Runner:   ${rankedPlayers[2]}`);
    console.log(`   Loser:        ${rankedPlayers[3]}\n`);

    const details = await getGameDetails(gameId);
    if (details.hasTransferred) {
      throw new Error("Prizes already transferred for this game");
    }
    if (details.players.length !== 4) {
      throw new Error(`Game not full. Current players: ${details.players.length}/4`);
    }

    const tx = await contract.prizeWithdrawal(gameIdBytes32, rankedPlayers);

    console.log(`   📝 Transaction sent: ${tx.hash}`);
    console.log(`   ⏳ Waiting for confirmation...`);

    const receipt = await tx.wait();

    console.log(`   ✅ Prizes distributed! Block: ${receipt.blockNumber}`);

    // Parse event
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
            console.log(`   Winner:      ${formatU2U(distributionDetails.winner.amount)} U2U`);
            console.log(`   1st Runner:  ${formatU2U(distributionDetails.firstRunner.amount)} U2U`);
            console.log(`   2nd Runner:  ${formatU2U(distributionDetails.secondRunner.amount)} U2U`);
            console.log(`   Loser:       ${formatU2U(distributionDetails.loser.amount)} U2U`);
            console.log(`   💰 Creator:   ${formatU2U(remainderToCreator)} U2U\n`);

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
 */
export async function emergencyWithdraw(gameId: string): Promise<EmergencyWithdrawResult> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized. Check PRIVATE_KEY environment variable.");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);

    console.log(`⚠️  Emergency withdrawal for game ${gameId}...`);

    const details = await getGameDetails(gameId);
    console.log(`   Amount: ${formatU2U(details.poolAmount)} U2U`);

    const tx = await contract.emergencyWithdraw(gameIdBytes32);

    console.log(`   📝 Transaction sent: ${tx.hash}`);
    console.log(`   ⏳ Waiting for confirmation...`);

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
 */
export async function getGameDetails(gameId: string): Promise<GameDetails> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized.");
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
 * Check if player has deposited
 */
export async function hasPlayerDeposited(gameId: string, playerAddress: string): Promise<boolean> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized.");
    }

    const gameIdBytes32 = gameIdToBytes32(gameId);
    return await contract.hasPlayerDeposited(gameIdBytes32, playerAddress);
  } catch (error: any) {
    console.error("❌ Error checking player deposit:", error.message);
    return false;
  }
}

/**
 * Get creator wallet address
 */
export async function getCreatorWallet(): Promise<string> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized.");
    }
    return await contract.getCreatorWallet();
  } catch (error: any) {
    console.error("❌ Error getting creator wallet:", error.message);
    throw error;
  }
}

/**
 * Get contract owner address
 */
export async function getOwner(): Promise<string> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized.");
    }
    return await contract.owner();
  } catch (error: any) {
    console.error("❌ Error getting owner:", error.message);
    throw error;
  }
}

/**
 * Get contract balance
 */
export async function getContractBalance(): Promise<bigint> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized.");
    }
    return await contract.getContractBalance();
  } catch (error: any) {
    console.error("❌ Error getting contract balance:", error.message);
    throw error;
  }
}

/**
 * Get entry fee
 */
export async function getEntryFee(): Promise<bigint> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized.");
    }
    return await contract.ENTRY_FEE();
  } catch (error: any) {
    console.error("❌ Error getting entry fee:", error.message);
    throw error;
  }
}

/**
 * Set creator wallet (only owner)
 */
export async function setCreatorWallet(newCreatorWallet: string): Promise<{ success: boolean; transactionHash: string; blockNumber: number }> {
  try {
    if (!contract) {
      throw new Error("Contract not initialized.");
    }

    console.log(`🔄 Updating creator wallet to ${newCreatorWallet}...`);

    const tx = await contract.setCreatorWallet(newCreatorWallet);

    console.log(`   📝 Transaction sent: ${tx.hash}`);
    console.log(`   ⏳ Waiting for confirmation...`);

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

// Export helper functions
export { gameIdToBytes32, formatU2U, CONTRACT_ADDRESS, RPC_URL };
