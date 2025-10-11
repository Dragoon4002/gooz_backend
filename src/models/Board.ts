import { Block, Player } from "../types";
import {
    CORNER_BLOCKS,
    BOARD_PROPERTIES,
    REST_HOUSE_PAYMENT,
    PARTY_HOUSE_COST
} from "../constants";

export class Board {
    private blocks: Block[];

    constructor() {
        this.blocks = this.createBoard();
    }

    private createBoard(): Block[] {
        const board: Block[] = [
            // Corner 1 - GO (position 0)
            {
                name: CORNER_BLOCKS.GO.name,
                imageURL: CORNER_BLOCKS.GO.imageURL,
                cornerBlock: true,
                cornerFunction: (player: Player) => {
                    // No action needed - money is collected when passing GO
                    console.log(`${player.name} landed on GO!`);
                }
            }
        ];

        // Side 1 - 3 properties (positions 1-3)
        BOARD_PROPERTIES.SIDE_1.forEach(prop => {
            board.push({
                ...prop,
                owner: null,
                cornerBlock: false
            } as Block);
        });

        // Corner 2 - Rest House (position 4)
        board.push({
            name: CORNER_BLOCKS.REST_HOUSE.name,
            imageURL: CORNER_BLOCKS.REST_HOUSE.imageURL,
            cornerBlock: true,
            cornerFunction: (player: Player) => {
                // Pay player and skip next turn
                player.poolAmt += REST_HOUSE_PAYMENT;
                player.skipTurns = 1;
            }
        });

        // Side 2 - 2 properties (positions 5-6)
        BOARD_PROPERTIES.SIDE_2.forEach(prop => {
            board.push({
                ...prop,
                owner: null,
                cornerBlock: false
            } as Block);
        });

        // Corner 3 - Jail (position 7)
        board.push({
            name: CORNER_BLOCKS.JAIL.name,
            imageURL: CORNER_BLOCKS.JAIL.imageURL,
            cornerBlock: true,
            cornerFunction: (player: Player) => {
                // Player lands in jail - set jail status
                player.inJail = true;
                // Logic for pay or roll will be handled in boardLogic.ts
            }
        });

        // Side 3 - 3 properties (positions 8-10)
        BOARD_PROPERTIES.SIDE_3.forEach(prop => {
            board.push({
                ...prop,
                owner: null,
                cornerBlock: false
            } as Block);
        });

        // Corner 4 - Party House (position 11)
        board.push({
            name: CORNER_BLOCKS.PARTY_HOUSE.name,
            imageURL: CORNER_BLOCKS.PARTY_HOUSE.imageURL,
            cornerBlock: true,
            cornerFunction: (player: Player) => {
                // Pay to party
                player.poolAmt -= PARTY_HOUSE_COST;
            }
        });

        // Side 4 - 2 properties (positions 12-13)
        BOARD_PROPERTIES.SIDE_4.forEach(prop => {
            board.push({
                ...prop,
                owner: null,
                cornerBlock: false
            } as Block);
        });

        return board;
    }

    getBoard(): Block[] {
        return this.blocks;
    }

    getBlock(position: number): Block | null {
        if (position >= 0 && position < this.blocks.length) {
            return this.blocks[position];
        }
        return null;
    }

    getBlockByName(name: string): Block | null {
        return this.blocks.find(block => block.name === name) || null;
    }

    getBoardLength(): number {
        return this.blocks.length;
    }

    isCornerBlock(position: number): boolean {
        const block = this.getBlock(position);
        return block ? block.cornerBlock : false;
    }

    getPropertiesOwnedBy(playerId: string): Block[] {
        return this.blocks.filter(block => block.owner === playerId);
    }

    getUnownedProperties(): Block[] {
        return this.blocks.filter(block => !block.cornerBlock && !block.owner);
    }

    resetBoard(): void {
        this.blocks.forEach(block => {
            if (!block.cornerBlock) {
                block.owner = null;
            }
        });
    }

    calculateRent(block: Block): number {
        if (block.rentfunction) {
            return block.rentfunction();
        }
        return block.rent || 50;
    }

    executeCornerFunction(block: Block, player: Player): void {
        if (block.cornerFunction) {
            block.cornerFunction(player);
        }
    }
}