import { Block, Player } from "../types";

export class Board {
    private blocks: Block[];

    constructor() {
        this.blocks = this.createBoard();
    }

    private createBoard(): Block[] {
        const board: Block[] = [
            // Corner 1 - GO (position 0)
            {
                name: "GO",
                imageURL: "/images/go.png",
                cornerBlock: true,
                cornerFunction: (player: Player) => {
                    player.poolAmt += 100;
                }
            }
        ];

        // Side 1 - 3 properties (positions 1-3)
        const side1Properties = [
            { name: "Mediterranean Avenue", price: 60, rent: 10, imageURL: "/images/mediterranean.png" },
            { name: "Baltic Avenue", price: 60, rent: 10, imageURL: "/images/baltic.png" },
            { name: "Oriental Avenue", price: 100, rent: 15, imageURL: "/images/oriental.png" }
        ];

        side1Properties.forEach(prop => {
            board.push({
                ...prop,
                owner: null,
                cornerBlock: false
            } as Block);
        });

        // Corner 2 - Jail (position 4)
        board.push({
            name: "Jail",
            imageURL: "/images/jail.png",
            cornerBlock: true,
            cornerFunction: (player: Player) => {
                player.poolAmt -= 100;
            }
        });

        // Side 2 - 3 properties (positions 5-6)
        const side2Properties = [
            { name: "Vermont Avenue", price: 100, rent: 15, imageURL: "/images/vermont.png" },
            { name: "Virginia Avenue", price: 160, rent: 25, imageURL: "/images/virginia.png" }
        ];

        side2Properties.forEach(prop => {
            board.push({
                ...prop,
                owner: null,
                cornerBlock: false
            } as Block);
        });

        // Corner 3 - Free Parking (position 7)
        board.push({
            name: "Free Parking",
            imageURL: "/images/freeparking.png",
            cornerBlock: true,
            cornerFunction: (player: Player) => {
                player.poolAmt -= 100;
            }
        });

        // Side 3 - 3 properties (positions 8-10)
        const side3Properties = [
            { name: "St. James Place", price: 180, rent: 30, imageURL: "/images/stjames.png" },
            { name: "Tennessee Avenue", price: 180, rent: 30, imageURL: "/images/tennessee.png" },
            { name: "New York Avenue", price: 200, rent: 35, imageURL: "/images/newyork.png" }
        ];

        side3Properties.forEach(prop => {
            board.push({
                ...prop,
                owner: null,
                cornerBlock: false
            } as Block);
        });

        // Corner 4 - Go to Jail (position 11)
        board.push({
            name: "Go to Jail",
            imageURL: "/images/gotojail.png",
            cornerBlock: true,
            cornerFunction: (player: Player) => {
                player.position = 4; // Move to jail (updated position)
                player.poolAmt -= 100;
            }
        });

        // Side 4 - 3 properties (positions 12-13)
        const side4Properties = [
            { name: "Kentucky Avenue", price: 220, rent: 40, imageURL: "/images/kentucky.png" },
            { name: "Marvin Gardens", price: 280, rent: 55, imageURL: "/images/marvin.png" }
        ];

        side4Properties.forEach(prop => {
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