import { WebSocket } from "ws";
import { Player, Block, SanitizedPlayer, GameState } from "../types";
import { DEFAULT_PLAYER_COLORS, INITIAL_PLAYER_MONEY, PROPERTY_SELL_RATE, TRANSACTION_FEE_RATE } from "../constants";

const crypto = require('crypto');

export class PlayerManager {
    static createPlayer(name: string, webSocket: WebSocket, colorCode?: string, playerId?: string): Player {
        return {
            id: playerId || PlayerManager.generatePlayerId(),
            name: name,
            webSocketLink: webSocket,
            poolAmt: INITIAL_PLAYER_MONEY || 500,
            ownedBlocks: [],
            colorCode: colorCode || PlayerManager.generateRandomColor(),
            position: 0,
            inJail: false,
            skipTurns: 0
        };
    }

    static generatePlayerId(): string {
        return crypto.randomBytes(8).toString('hex');
    }

    static generateRandomColor(): string {
        const colors = DEFAULT_PLAYER_COLORS;
        return colors[Math.floor(Math.random() * colors.length)];
    }

    static sanitizePlayer(player: Player): SanitizedPlayer {
        return {
            id: player.id,
            name: player.name,
            poolAmt: player.poolAmt,
            ownedBlocks: player.ownedBlocks,
            colorCode: player.colorCode,
            position: player.position,
            inJail: player.inJail,
            skipTurns: player.skipTurns
        };
    }

    static movePlayer(player: Player, diceRoll: number, boardLength: number): { newPosition: number; passedGo: boolean } {
        const oldPosition = player.position;
        const newPosition = (oldPosition + diceRoll) % boardLength;
        const passedGo = newPosition < oldPosition || (oldPosition + diceRoll >= boardLength || newPosition === 0);

        player.position = newPosition;

        return { newPosition, passedGo };
    }

    static collectPassGoMoney(player: Player, amount: number = 100): void {
        player.poolAmt += amount;
    }

    static canAffordProperty(player: Player, block: Block): boolean {
        const price = block.price || 0;
        const fee = Math.floor(price * TRANSACTION_FEE_RATE);
        return player.poolAmt >= (price + fee);
    }

    static canAffordRent(player: Player, rentAmount: number): boolean {
        const fee = Math.floor(rentAmount * TRANSACTION_FEE_RATE);
        return player.poolAmt >= (rentAmount + fee);
    }

    static buyProperty(player: Player, block: Block): boolean {
        if (!PlayerManager.canAffordProperty(player, block)) {
            return false;
        }

        const price = block.price || 0;
        const fee = Math.floor(price * 0.01);
        player.poolAmt -= (price + fee);
        player.ownedBlocks.push(block.name);
        block.owner = player.id;

        return true;
    }

    static sellProperty(player: Player, block: Block): number {
        if (!player.ownedBlocks.includes(block.name)) {
            return 0;
        }

        const sellPrice = Math.floor((block.price || 0) * PROPERTY_SELL_RATE);
        const fee = Math.floor(sellPrice * TRANSACTION_FEE_RATE);
        const netAmount = sellPrice - fee;
        player.poolAmt += netAmount;
        player.ownedBlocks = player.ownedBlocks.filter(b => b !== block.name);
        block.owner = null;

        return sellPrice;
    }

    static payRent(payer: Player, owner: Player, amount: number): boolean {
        const fee = Math.floor(amount * TRANSACTION_FEE_RATE);
        const totalCost = amount + fee;

        if (payer.poolAmt < totalCost) {
            return false;
        }

        payer.poolAmt -= totalCost;
        owner.poolAmt += amount;

        return true;
    }

    static ownsProperty(player: Player, blockName: string): boolean {
        return player.ownedBlocks.includes(blockName);
    }

    static getPlayerById(players: Player[], playerId: string): Player | undefined {
        return players.find(p => p.id === playerId);
    }

    static removePlayerFromGame(players: Player[], playerId: string): Player[] {
        return players.filter(p => p.id !== playerId);
    }

    static validatePlayerTurn(gameState: GameState, playerId: string): boolean {
        if (!gameState.gameStarted) return false;

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        return currentPlayer && currentPlayer.id === playerId;
    }

    static getNextPlayerIndex(currentIndex: number, totalPlayers: number): number {
        return (currentIndex + 1) % totalPlayers;
    }

    static isPlayerIdDuplicate(players: Player[], playerId: string): boolean {
        return players.some(p => p.id === playerId);
    }
}