import { Block, Player } from "../types";
export declare class Board {
    private blocks;
    constructor();
    private createBoard;
    getBoard(): Block[];
    getBlock(position: number): Block | null;
    getBlockByName(name: string): Block | null;
    getBoardLength(): number;
    isCornerBlock(position: number): boolean;
    getPropertiesOwnedBy(playerId: string): Block[];
    getUnownedProperties(): Block[];
    resetBoard(): void;
    calculateRent(block: Block): number;
    executeCornerFunction(block: Block, player: Player): void;
}
