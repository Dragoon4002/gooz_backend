// ===== ENUMS =====

enum PlayerColor {
  RED = 'RED',
  BLUE = 'BLUE',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  PURPLE = 'PURPLE',
  ORANGE = 'ORANGE',
  PINK = 'PINK',
  CYAN = 'CYAN'
}

enum BlockType {
  PROPERTY = 'PROPERTY',
  START = 'START',
  EVENT = 'EVENT'
}

enum EventType {
  CHANCE = 'CHANCE',
  COMMUNITY_CHEST = 'COMMUNITY_CHEST',
  TAX = 'TAX',
  JAIL = 'JAIL',
  FREE_PARKING = 'FREE_PARKING',
  GO_TO_JAIL = 'GO_TO_JAIL'
}

enum GameStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  PAUSED = 'PAUSED'
}

enum TransactionType {
  PLATFORM_FEE = 'PLATFORM_FEE',
  PROPERTY_PURCHASE = 'PROPERTY_PURCHASE',
  RENT_PAYMENT = 'RENT_PAYMENT',
  EVENT_PAYMENT = 'EVENT_PAYMENT',
  SECURITY_DEPOSIT = 'SECURITY_DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL'
}

// ===== CORE INTERFACES =====

interface Player {
  id: string;
  address: string; // Wallet address
  color: PlayerColor;
  securityDeposit: number; // Initial deposit amount
  playablePool: number; // 90% of security deposit
  currentBalance: number; // Current available funds
  currentPosition: number; // Current block position (0-based index)
  ownedBlocks: string[]; // Array of owned block IDs
  isActive: boolean;
  joinedAt: Date;
  lastMove?: Date;
}

interface Block {
  id: string;
  position: number; // Position on board (0-based)
  side: BoardSide; // Which side of the board (0-3)
  sidePosition: number; // Position within the side
  type: BlockType;
  name: string;
  initialPrice?: number; // Purchase price (null for non-purchasable blocks)
  rentPrice?: number; // Rent price when landed on
  ownerId?: string; // Player ID who owns this block
  eventType?: EventType; // For event blocks
  isCorner: boolean; // Special corner blocks
}

interface BoardSide {
  sideIndex: number; // 0: bottom, 1: right, 2: top, 3: left
  blocks: Block[];
  cornerBlock: Block; // Leading corner block
}

interface Board {
  sides: BoardSide[]; // Array of 4 sides
  totalBlocks: number;
  platformFeePercentage: number; // Fee taken on each purchase
}

interface Game {
  id: string;
  players: Player[];
  board: Board;
  currentPlayerIndex: number; // Index of current player's turn
  status: GameStatus;
  maxPlayers: number;
  minPlayers: number;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  winner?: string; // Player ID of winner
  totalPot: number; // Total money in the game
  platformFeesCollected: number;
}

// ===== TRANSACTION & FINANCIAL INTERFACES =====

interface Transaction {
  id: string;
  gameId: string;
  fromPlayerId?: string;
  toPlayerId?: string;
  amount: number;
  type: TransactionType;
  blockId?: string; // For property-related transactions
  timestamp: Date;
  txHash?: string; // Blockchain transaction hash
  description: string;
}

interface PlatformFee {
  percentage: number;
  amount: number;
  transactionId: string;
}

interface RentPayment {
  payerId: string;
  ownerId: string;
  blockId: string;
  amount: number;
  transactionId: string;
}

// ===== GAME ACTION INTERFACES =====

interface DiceRoll {
  dice1: number;
  dice2: number;
  total: number;
  playerId: string;
  timestamp: Date;
}

interface PlayerMove {
  playerId: string;
  fromPosition: number;
  toPosition: number;
  diceRoll: DiceRoll;
  landedBlock: Block;
  timestamp: Date;
}

interface PropertyPurchase {
  playerId: string;
  blockId: string;
  purchasePrice: number;
  platformFee: number;
  transactionId: string;
  timestamp: Date;
}

interface GameAction {
  id: string;
  gameId: string;
  playerId: string;
  actionType: 'ROLL_DICE' | 'MOVE' | 'BUY_PROPERTY' | 'PAY_RENT' | 'EVENT_TRIGGER';
  details: DiceRoll | PlayerMove | PropertyPurchase | RentPayment;
  timestamp: Date;
}

// ===== GAME STATE INTERFACES =====

interface GameState {
  game: Game;
  currentPlayer: Player;
  lastAction?: GameAction;
  availableActions: string[]; // Actions current player can take
  diceRolled: boolean;
  awaitingPlayerAction: boolean;
}

interface PlayerStats {
  playerId: string;
  totalPropertiesOwned: number;
  totalRentCollected: number;
  totalRentPaid: number;
  totalPlatformFeesPaid: number;
  netWorth: number; // Current balance + property values
  propertyValues: number; // Total value of owned properties
}

interface GameStats {
  gameId: string;
  playerStats: PlayerStats[];
  totalTransactions: number;
  totalPlatformFees: number;
  averagePropertyPrice: number;
  mostExpensiveProperty: Block;
  richestPlayer: Player;
}

// ===== API RESPONSE INTERFACES =====

interface CreateGameRequest {
  maxPlayers: number;
  minPlayers: number;
  securityDeposit: number;
  platformFeePercentage: number;
  creatorAddress: string;
  creatorColor: PlayerColor;
}

interface JoinGameRequest {
  gameId: string;
  playerAddress: string;
  playerColor: PlayerColor;
  securityDeposit: number;
}

interface GameActionRequest {
  gameId: string;
  playerId: string;
  actionType: string;
  data?: any; // Additional action-specific data
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

interface GameListResponse {
  games: Game[];
  totalGames: number;
  page: number;
  pageSize: number;
}

// ===== BLOCKCHAIN INTERFACES =====

interface ContractAddress {
  gameContract: string;
  tokenContract: string;
  feeCollectorContract: string;
}

interface BlockchainTransaction {
  txHash: string;
  blockNumber: number;
  gasUsed: number;
  gasPrice: number;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
}

interface SmartContractEvent {
  eventName: string;
  gameId: string;
  playerId?: string;
  blockId?: string;
  amount?: number;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
}

// ===== UTILITY INTERFACES =====

interface GameConfiguration {
  boardSize: number; // Total number of blocks
  blocksPerSide: number; // Blocks per side (excluding corners)
  startingMoney: number;
  securityDepositPercentage: number; // 90% becomes playable
  platformFeePercentage: number;
  passStartBonus?: number; // Bonus for passing START block
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// ===== EXPORT TYPES =====

export {
  // Enums
  PlayerColor,
  BlockType,
  EventType,
  GameStatus,
  TransactionType,
  
  // Core Interfaces
  Player,
  Block,
  BoardSide,
  Board,
  Game,
  
  // Transaction Interfaces
  Transaction,
  PlatformFee,
  RentPayment,
  
  // Game Action Interfaces
  DiceRoll,
  PlayerMove,
  PropertyPurchase,
  GameAction,
  
  // Game State Interfaces
  GameState,
  PlayerStats,
  GameStats,
  
  // API Interfaces
  CreateGameRequest,
  JoinGameRequest,
  GameActionRequest,
  ApiResponse,
  GameListResponse,
  
  // Blockchain Interfaces
  ContractAddress,
  BlockchainTransaction,
  SmartContractEvent,
  
  // Utility Interfaces
  GameConfiguration,
  ValidationResult
};