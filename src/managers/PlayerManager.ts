import { WebSocket } from "ws";
import { Player, Block, SanitizedPlayer, GameState } from "../types";

const crypto = require('crypto');

export class PlayerManager {
    static createPlayer(name: string, webSocket: WebSocket, colorCode?: string, playerId?: string): Player {
        return {
            id: playerId || PlayerManager.generatePlayerId(),
            name: name,
            webSocketLink: webSocket,
            poolAmt: 1500,
            ownedBlocks: [],
            colorCode: colorCode || PlayerManager.generateRandomColor(),
            position: 0
        };
    }

    static generatePlayerId(): string {
        return crypto.randomBytes(8).toString('hex');
    }

    static generateRandomColor(): string {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    static sanitizePlayer(player: Player): SanitizedPlayer {
        return {
            id: player.id,
            name: player.name,
            poolAmt: player.poolAmt,
            ownedBlocks: player.ownedBlocks,
            colorCode: player.colorCode,
            position: player.position
        };
    }

    static movePlayer(player: Player, diceRoll: number, boardLength: number): { newPosition: number; passedGo: boolean } {
        const oldPosition = player.position;
        const newPosition = (oldPosition + diceRoll) % boardLength;
        const passedGo = newPosition < oldPosition || (oldPosition + diceRoll >= boardLength);

        player.position = newPosition;

        return { newPosition, passedGo };
    }

    static collectPassGoMoney(player: Player, amount: number = 100): void {
        player.poolAmt += amount;
    }

    static canAffordProperty(player: Player, block: Block): boolean {
        return player.poolAmt >= (block.price || 0);
    }

    static canAffordRent(player: Player, rentAmount: number): boolean {
        return player.poolAmt >= rentAmount;
    }

    static buyProperty(player: Player, block: Block): boolean {
        if (!PlayerManager.canAffordProperty(player, block)) {
            return false;
        }

        player.poolAmt -= (block.price || 0);
        player.ownedBlocks.push(block.name);
        block.owner = player.id;

        return true;
    }

    static sellProperty(player: Player, block: Block): number {
        if (!player.ownedBlocks.includes(block.name)) {
            return 0;
        }

        const sellPrice = Math.floor((block.price || 0) / 2);
        player.poolAmt += sellPrice;
        player.ownedBlocks = player.ownedBlocks.filter(b => b !== block.name);
        block.owner = null;

        return sellPrice;
    }

    static payRent(payer: Player, owner: Player, amount: number): boolean {
        if (!PlayerManager.canAffordRent(payer, amount)) {
            return false;
        }

        payer.poolAmt -= amount;
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