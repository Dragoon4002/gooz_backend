"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoom = void 0;
const Board_1 = require("./Board");
const PlayerManager_1 = require("../managers/PlayerManager");
class GameRoom {
    constructor(id) {
        this.id = id;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameStarted = false;
        this.waitingForAction = false;
        this.pendingBlock = null;
        this.pendingRent = null;
        this.boardManager = new Board_1.Board();
        this.board = this.boardManager.getBoard();
    }
    addPlayer(player) {
        if (this.players.length >= 4) {
            return false; // Game is full
        }
        if (this.gameStarted) {
            return false; // Game already started
        }
        this.players.push(player);
        return true;
    }
    removePlayer(playerId) {
        const initialLength = this.players.length;
        this.players = PlayerManager_1.PlayerManager.removePlayerFromGame(this.players, playerId);
        if (this.players.length < initialLength) {
            // Adjust current player index if needed
            if (this.currentPlayerIndex >= this.players.length) {
                this.currentPlayerIndex = 0;
            }
            return true;
        }
        return false;
    }
    startGame() {
        if (this.players.length < 2 || this.gameStarted) {
            return false;
        }
        this.gameStarted = true;
        this.currentPlayerIndex = 0;
        return true;
    }
    getCurrentPlayer() {
        if (this.players.length === 0) {
            return null;
        }
        return this.players[this.currentPlayerIndex];
    }
    nextTurn() {
        if (this.players.length > 0) {
            this.currentPlayerIndex = PlayerManager_1.PlayerManager.getNextPlayerIndex(this.currentPlayerIndex, this.players.length);
        }
    }
    canPlayerTakeAction(playerId) {
        return PlayerManager_1.PlayerManager.validatePlayerTurn(this, playerId) && !this.waitingForAction;
    }
    canPlayerBuyOrPass(playerId) {
        var _a;
        return this.waitingForAction &&
            this.pendingBlock !== null &&
            ((_a = this.getCurrentPlayer()) === null || _a === void 0 ? void 0 : _a.id) === playerId;
    }
    setPendingAction(block) {
        this.waitingForAction = true;
        this.pendingBlock = block;
    }
    clearPendingAction() {
        this.waitingForAction = false;
        this.pendingBlock = null;
    }
    setPendingRent(rent) {
        this.pendingRent = rent;
        this.waitingForAction = true;
    }
    clearPendingRent() {
        this.pendingRent = null;
        this.waitingForAction = false;
    }
    getBlockAtPosition(position) {
        return this.boardManager.getBlock(position);
    }
    getBlockByName(name) {
        return this.boardManager.getBlockByName(name);
    }
    getBoardLength() {
        return this.boardManager.getBoardLength();
    }
    isGameFull() {
        return this.players.length >= 4;
    }
    isGameEmpty() {
        return this.players.length === 0;
    }
    hasMinimumPlayers() {
        return this.players.length >= 2;
    }
    getPlayerById(playerId) {
        return PlayerManager_1.PlayerManager.getPlayerById(this.players, playerId);
    }
    isPlayerInGame(playerId) {
        return this.getPlayerById(playerId) !== undefined;
    }
    getAllSanitizedPlayers() {
        return this.players.map(player => PlayerManager_1.PlayerManager.sanitizePlayer(player));
    }
    resetGame() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameStarted = false;
        this.waitingForAction = false;
        this.pendingBlock = null;
        this.pendingRent = null;
        this.boardManager.resetBoard();
        this.board = this.boardManager.getBoard();
    }
    getGameState() {
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
    canStartGame() {
        return !this.gameStarted && this.hasMinimumPlayers();
    }
}
exports.GameRoom = GameRoom;
