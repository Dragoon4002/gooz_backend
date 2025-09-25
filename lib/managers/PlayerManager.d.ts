import { WebSocket } from "ws";
import { Player, Block, SanitizedPlayer, GameState } from "../types";
export declare class PlayerManager {
    static createPlayer(name: string, webSocket: WebSocket, colorCode?: string): Player;
    static generatePlayerId(): string;
    static generateRandomColor(): string;
    static sanitizePlayer(player: Player): SanitizedPlayer;
    static movePlayer(player: Player, diceRoll: number, boardLength: number): {
        newPosition: number;
        passedGo: boolean;
    };
    static collectPassGoMoney(player: Player, amount?: number): void;
    static canAffordProperty(player: Player, block: Block): boolean;
    static canAffordRent(player: Player, rentAmount: number): boolean;
    static buyProperty(player: Player, block: Block): boolean;
    static sellProperty(player: Player, block: Block): number;
    static payRent(payer: Player, owner: Player, amount: number): boolean;
    static ownsProperty(player: Player, blockName: string): boolean;
    static getPlayerById(players: Player[], playerId: string): Player | undefined;
    static removePlayerFromGame(players: Player[], playerId: string): Player[];
    static validatePlayerTurn(gameState: GameState, playerId: string): boolean;
    static getNextPlayerIndex(currentIndex: number, totalPlayers: number): number;
}
