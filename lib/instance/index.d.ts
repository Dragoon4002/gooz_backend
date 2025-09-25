declare enum PlayerColor {
    RED = "RED",
    BLUE = "BLUE",
    GREEN = "GREEN",
    YELLOW = "YELLOW",
    PURPLE = "PURPLE",
    ORANGE = "ORANGE",
    PINK = "PINK",
    CYAN = "CYAN"
}
declare enum BlockType {
    PROPERTY = "PROPERTY",
    START = "START",
    EVENT = "EVENT"
}
declare enum EventType {
    CHANCE = "CHANCE",
    COMMUNITY_CHEST = "COMMUNITY_CHEST",
    TAX = "TAX",
    JAIL = "JAIL",
    FREE_PARKING = "FREE_PARKING",
    GO_TO_JAIL = "GO_TO_JAIL"
}
declare enum GameStatus {
    WAITING = "WAITING",
    IN_PROGRESS = "IN_PROGRESS",
    FINISHED = "FINISHED",
    PAUSED = "PAUSED"
}
declare enum TransactionType {
    PLATFORM_FEE = "PLATFORM_FEE",
    PROPERTY_PURCHASE = "PROPERTY_PURCHASE",
    RENT_PAYMENT = "RENT_PAYMENT",
    EVENT_PAYMENT = "EVENT_PAYMENT",
    SECURITY_DEPOSIT = "SECURITY_DEPOSIT",
    WITHDRAWAL = "WITHDRAWAL"
}
interface Player {
    id: string;
    address: string;
    color: PlayerColor;
    securityDeposit: number;
    playablePool: number;
    currentBalance: number;
    currentPosition: number;
    ownedBlocks: string[];
    isActive: boolean;
    joinedAt: Date;
    lastMove?: Date;
}
interface Block {
    id: string;
    position: number;
    side: BoardSide;
    sidePosition: number;
    type: BlockType;
    name: string;
    initialPrice?: number;
    rentPrice?: number;
    ownerId?: string;
    eventType?: EventType;
    isCorner: boolean;
}
interface BoardSide {
    sideIndex: number;
    blocks: Block[];
    cornerBlock: Block;
}
interface Board {
    sides: BoardSide[];
    totalBlocks: number;
    platformFeePercentage: number;
}
interface Game {
    id: string;
    players: Player[];
    board: Board;
    currentPlayerIndex: number;
    status: GameStatus;
    maxPlayers: number;
    minPlayers: number;
    createdAt: Date;
    startedAt?: Date;
    finishedAt?: Date;
    winner?: string;
    totalPot: number;
    platformFeesCollected: number;
}
interface Transaction {
    id: string;
    gameId: string;
    fromPlayerId?: string;
    toPlayerId?: string;
    amount: number;
    type: TransactionType;
    blockId?: string;
    timestamp: Date;
    txHash?: string;
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
interface GameState {
    game: Game;
    currentPlayer: Player;
    lastAction?: GameAction;
    availableActions: string[];
    diceRolled: boolean;
    awaitingPlayerAction: boolean;
}
interface PlayerStats {
    playerId: string;
    totalPropertiesOwned: number;
    totalRentCollected: number;
    totalRentPaid: number;
    totalPlatformFeesPaid: number;
    netWorth: number;
    propertyValues: number;
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
    data?: any;
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
interface GameConfiguration {
    boardSize: number;
    blocksPerSide: number;
    startingMoney: number;
    securityDepositPercentage: number;
    platformFeePercentage: number;
    passStartBonus?: number;
}
interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}
export { PlayerColor, BlockType, EventType, GameStatus, TransactionType, Player, Block, BoardSide, Board, Game, Transaction, PlatformFee, RentPayment, DiceRoll, PlayerMove, PropertyPurchase, GameAction, GameState, PlayerStats, GameStats, CreateGameRequest, JoinGameRequest, GameActionRequest, ApiResponse, GameListResponse, ContractAddress, BlockchainTransaction, SmartContractEvent, GameConfiguration, ValidationResult };
