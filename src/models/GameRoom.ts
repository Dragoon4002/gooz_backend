import { Player, Block, PendingRent, GameState } from "../types";
import { Board } from "./Board";
import { PlayerManager } from "../managers/PlayerManager";

export class GameRoom implements GameState {
    public id: string;
    public players: Player[];
    public currentPlayerIndex: number;
    public gameStarted: boolean;
    public waitingForAction: boolean;
    public pendingBlock: Block | null;
    public pendingRent: PendingRent | null;
    public board: Block[];
    public creatorId: string | null;
    private boardManager: Board;

    constructor(id: string) {
        this.id = id;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameStarted = false;
        this.waitingForAction = false;
        this.pendingBlock = null;
        this.pendingRent = null;
        this.creatorId = null;
        this.boardManager = new Board();
        this.board = this.boardManager.getBoard();
    }

    addPlayer(player: Player): boolean {
        if (this.players.length >= 4) {
            return false; // Game is full
        }

        if (this.gameStarted) {
            return false; // Game already started
        }

        // Set creator as first player
        if (this.players.length === 0) {
            this.creatorId = player.id;
        }

        this.players.push(player);
        return true;
    }

    removePlayer(playerId: string): boolean {
        const initialLength = this.players.length;
        this.players = PlayerManager.removePlayerFromGame(this.players, playerId);

        if (this.players.length < initialLength) {
            // Adjust current player index if needed
            if (this.currentPlayerIndex >= this.players.length) {
                this.currentPlayerIndex = 0;
            }
            return true;
        }
        return false;
    }

    startGame(): boolean {
        if (this.players.length < 2 || this.gameStarted) {
            return false;
        }

        this.gameStarted = true;
        this.currentPlayerIndex = 0;
        return true;
    }

    getCurrentPlayer(): Player | null {
        if (this.players.length === 0) {
            return null;
        }
        return this.players[this.currentPlayerIndex];
    }

    nextTurn(): void {
        if (this.players.length > 0) {
            this.currentPlayerIndex = PlayerManager.getNextPlayerIndex(
                this.currentPlayerIndex,
                this.players.length
            );
        }
    }

    canPlayerTakeAction(playerId: string): boolean {
        return PlayerManager.validatePlayerTurn(this, playerId) && !this.waitingForAction;
    }

    canPlayerBuyOrPass(playerId: string): boolean {
        return this.waitingForAction &&
            this.pendingBlock !== null &&
            this.getCurrentPlayer()?.id === playerId;
    }

    setPendingAction(block: Block): void {
        this.waitingForAction = true;
        this.pendingBlock = block;
    }

    clearPendingAction(): void {
        this.waitingForAction = false;
        this.pendingBlock = null;
    }

    setPendingRent(rent: PendingRent): void {
        this.pendingRent = rent;
        this.waitingForAction = true;
    }

    clearPendingRent(): void {
        this.pendingRent = null;
        this.waitingForAction = false;
    }

    getBlockAtPosition(position: number): Block | null {
        return this.boardManager.getBlock(position);
    }

    getBlockByName(name: string): Block | null {
        return this.boardManager.getBlockByName(name);
    }

    getBoardLength(): number {
        return this.boardManager.getBoardLength();
    }

    isGameFull(): boolean {
        return this.players.length >= 4;
    }

    isGameEmpty(): boolean {
        return this.players.length === 0;
    }

    hasMinimumPlayers(): boolean {
        return this.players.length >= 2;
    }

    getPlayerById(playerId: string): Player | undefined {
        return PlayerManager.getPlayerById(this.players, playerId);
    }

    isPlayerInGame(playerId: string): boolean {
        return this.getPlayerById(playerId) !== undefined;
    }

    getAllSanitizedPlayers() {
        return this.players.map(player => PlayerManager.sanitizePlayer(player));
    }

    resetGame(): void {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameStarted = false;
        this.waitingForAction = false;
        this.pendingBlock = null;
        this.pendingRent = null;
        this.boardManager.resetBoard();
        this.board = this.boardManager.getBoard();
    }

    getGameState(): GameState {
        return {
            id: this.id,
            players: this.players,
            currentPlayerIndex: this.currentPlayerIndex,
            gameStarted: this.gameStarted,
            waitingForAction: this.waitingForAction,
            pendingBlock: this.pendingBlock,
            pendingRent: this.pendingRent,
            board: this.board
        };
    }

    canStartGame(): boolean {
        return !this.gameStarted && this.hasMinimumPlayers();
    }

    isCreator(playerId: string): boolean {
        return this.creatorId === playerId;
    }
}