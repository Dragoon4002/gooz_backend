import { ethers } from "ethers";
import { config } from "dotenv";

config();

// Contract details from deployment
const CONTRACT_ADDRESS = "0x2D1524FFE7bB9d6876763650a5FDD60f2e59229d";
const RPC_URL = "https://rpc-nebulas-testnet.u2u.xyz";
const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract ABI (only the functions we need)
const CONTRACT_ABI = [
  "function deposit(uint256 _gameId) external payable",
  "function distributePrizes(uint256 _gameId, address _winner, address _firstRunner, address _secondRunner, address _loser) external",
  "function getGameDetails(uint256 _gameId) external view returns (address[] memory players, uint256 totalPool, bool isActive, bool isCompleted)",
  "function getPlayers(uint256 _gameId) external view returns (address[] memory)",
  "function owner() external view returns (address)",
  "function ENTRY_FEE() external view returns (uint256)",
  "function TOTAL_PLAYERS() external view returns (uint256)",
  "function getContractBalance() external view returns (uint256)",
  "function emergencyWithdraw() external",
  "event PlayerDeposited(uint256 indexed gameId, address indexed player, uint256 amount)",
  "event GameStarted(uint256 indexed gameId, address[] players)",
  "event PrizeDistributed(uint256 indexed gameId, address indexed winner, address indexed firstRunner, address secondRunner, address loser)"
];

// Create provider and contract instances
const provider = new ethers.JsonRpcProvider(RPC_URL);
const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ownerWallet);

// ============================================
// READ FUNCTIONS (No gas fees)
// ============================================

/**
 * Get game details
 * @param {number} gameId - The game ID
 */
export async function getGameDetails(gameId) {
  try {
    const [players, totalPool, isActive, isCompleted] = await contract.getGameDetails(gameId);
    
    return {
      gameId,
      players: players,
      totalPool: ethers.formatEther(totalPool),
      isActive,
      isCompleted,
      playerCount: players.length
    };
  } catch (error) {
    console.error("Error getting game details:", error.message);
    throw error;
  }
}

/**
 * Get all players in a game
 * @param {number} gameId - The game ID
 */
export async function getPlayers(gameId) {
  try {
    const players = await contract.getPlayers(gameId);
    return players;
  } catch (error) {
    console.error("Error getting players:", error.message);
    throw error;
  }
}

/**
 * Get contract owner address
 */
export async function getOwner() {
  try {
    const owner = await contract.owner();
    return owner;
  } catch (error) {
    console.error("Error getting owner:", error.message);
    throw error;
  }
}

/**
 * Get entry fee
 */
export async function getEntryFee() {
  try {
    const entryFee = await contract.ENTRY_FEE();
    return ethers.formatEther(entryFee);
  } catch (error) {
    console.error("Error getting entry fee:", error.message);
    throw error;
  }
}

/**
 * Get contract balance
 */
export async function getContractBalance() {
  try {
    const balance = await contract.getContractBalance();
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Error getting contract balance:", error.message);
    throw error;
  }
}

/**
 * Check if a wallet has enough balance for entry fee
 * @param {string} walletAddress - Player's wallet address
 */
export async function checkWalletBalance(walletAddress) {
  try {
    const balance = await provider.getBalance(walletAddress);
    const entryFee = await contract.ENTRY_FEE();
    
    return {
      balance: ethers.formatEther(balance),
      hasEnough: balance >= entryFee,
      required: ethers.formatEther(entryFee)
    };
  } catch (error) {
    console.error("Error checking wallet balance:", error.message);
    throw error;
  }
}

// ============================================
// WRITE FUNCTIONS (Requires gas fees)
// ============================================

/**
 * Player deposits entry fee (called by player's wallet)
 * @param {number} gameId - The game ID
 * @param {string} playerPrivateKey - Player's private key
 */
export async function playerDeposit(gameId, playerPrivateKey) {
  try {
    // Create player wallet
    const playerWallet = new ethers.Wallet(playerPrivateKey, provider);
    const playerContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, playerWallet);
    
    // Get entry fee
    const entryFee = await contract.ENTRY_FEE();
    
    console.log(`Player ${playerWallet.address} depositing for game ${gameId}...`);
    
    // Send deposit transaction
    const tx = await playerContract.deposit(gameId, {
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
      playerAddress: playerWallet.address,
      gameId
    };
  } catch (error) {
    console.error("Error in player deposit:", error.message);
    throw error;
  }
}

/**
 * Distribute prizes after game ends (only owner can call)
 * @param {number} gameId - The game ID
 * @param {string} winnerAddress - Winner's wallet address
 * @param {string} firstRunnerAddress - 1st runner-up's wallet address
 * @param {string} secondRunnerAddress - 2nd runner-up's wallet address
 * @param {string} loserAddress - Loser's wallet address
 */
export async function distributePrizes(gameId, winnerAddress, firstRunnerAddress, secondRunnerAddress, loserAddress) {
  try {
    console.log(`Distributing prizes for game ${gameId}...`);
    console.log(`Winner: ${winnerAddress}`);
    console.log(`1st Runner: ${firstRunnerAddress}`);
    console.log(`2nd Runner: ${secondRunnerAddress}`);
    console.log(`Loser: ${loserAddress}`);
    
    // Send transaction
    const tx = await contract.distributePrizes(
      gameId,
      winnerAddress,
      firstRunnerAddress,
      secondRunnerAddress,
      loserAddress
    );
    
    console.log(`Transaction sent: ${tx.hash}`);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    console.log(`✅ Prizes distributed successfully! Block: ${receipt.blockNumber}`);
    
    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gameId
    };
  } catch (error) {
    console.error("Error distributing prizes:", error.message);
    throw error;
  }
}

/**
 * Emergency withdraw (only owner, for leftover funds)
 */
export async function emergencyWithdraw() {
  try {
    console.log("Executing emergency withdraw...");
    
    const tx = await contract.emergencyWithdraw();
    
    console.log(`Transaction sent: ${tx.hash}`);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    console.log(`✅ Emergency withdraw successful! Block: ${receipt.blockNumber}`);
    
    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("Error in emergency withdraw:", error.message);
    throw error;
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Listen for PlayerDeposited events
 * @param {Function} callback - Callback function when event is triggered
 */
export function listenForDeposits(callback) {
  contract.on("PlayerDeposited", (gameId, player, amount, event) => {
    const depositInfo = {
      gameId: gameId.toString(),
      player: player,
      amount: ethers.formatEther(amount),
      blockNumber: event.log.blockNumber,
      transactionHash: event.log.transactionHash
    };
    
    console.log("🎮 Player Deposited Event:", depositInfo);
    callback(depositInfo);
  });
  
  console.log("👂 Listening for PlayerDeposited events...");
}

/**
 * Listen for GameStarted events (when all 4 players deposit)
 * @param {Function} callback - Callback function when event is triggered
 */
export function listenForGameStart(callback) {
  contract.on("GameStarted", (gameId, players, event) => {
    const gameInfo = {
      gameId: gameId.toString(),
      players: players,
      blockNumber: event.log.blockNumber,
      transactionHash: event.log.transactionHash
    };
    
    console.log("🚀 Game Started Event:", gameInfo);
    callback(gameInfo);
  });
  
  console.log("👂 Listening for GameStarted events...");
}

/**
 * Listen for PrizeDistributed events
 * @param {Function} callback - Callback function when event is triggered
 */
export function listenForPrizeDistribution(callback) {
  contract.on("PrizeDistributed", (gameId, winner, firstRunner, secondRunner, loser, event) => {
    const prizeInfo = {
      gameId: gameId.toString(),
      winner: winner,
      firstRunner: firstRunner,
      secondRunner: secondRunner,
      loser: loser,
      blockNumber: event.log.blockNumber,
      transactionHash: event.log.transactionHash
    };
    
    console.log("💰 Prize Distributed Event:", prizeInfo);
    callback(prizeInfo);
  });
  
  console.log("👂 Listening for PrizeDistributed events...");
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create a game session (initialize game data in your backend)
 * @param {number} gameId - The game ID
 */
export async function initializeGame(gameId) {
  // This doesn't interact with the contract
  // Just initialize your game data in your database
  console.log(`🎮 Initializing game ${gameId} in backend...`);
  
  return {
    gameId,
    status: "waiting_for_players",
    players: [],
    createdAt: new Date().toISOString()
  };
}

/**
 * Validate if game can start (all 4 players deposited)
 * @param {number} gameId - The game ID
 */
export async function canGameStart(gameId) {
  try {
    const details = await getGameDetails(gameId);
    return details.playerCount === 4 && details.isActive && !details.isCompleted;
  } catch (error) {
    return false;
  }
}

export default {
  getGameDetails,
  getPlayers,
  getOwner,
  getEntryFee,
  getContractBalance,
  checkWalletBalance,
  playerDeposit,
  distributePrizes,
  emergencyWithdraw,
  listenForDeposits,
  listenForGameStart,
  listenForPrizeDistribution,
  initializeGame,
  canGameStart
};