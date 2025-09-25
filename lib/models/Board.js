"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Board = void 0;
class Board {
    constructor() {
        this.blocks = this.createBoard();
    }
    createBoard() {
        const board = [
            // Corner 1 - GO
            {
                name: "GO",
                imageURL: "/images/go.png",
                cornerBlock: true,
                cornerFunction: (player) => {
                    player.poolAmt += 100;
                }
            }
        ];
        // Side 1 - 4 properties
        const side1Properties = [
            { name: "Mediterranean Avenue", price: 60, rent: 10, imageURL: "/images/mediterranean.png" },
            { name: "Baltic Avenue", price: 60, rent: 10, imageURL: "/images/baltic.png" },
            { name: "Oriental Avenue", price: 100, rent: 15, imageURL: "/images/oriental.png" },
            { name: "Vermont Avenue", price: 100, rent: 15, imageURL: "/images/vermont.png" }
        ];
        side1Properties.forEach(prop => {
            board.push(Object.assign(Object.assign({}, prop), { owner: null, cornerBlock: false }));
        });
        // Corner 2 - Jail
        board.push({
            name: "Jail",
            imageURL: "/images/jail.png",
            cornerBlock: true,
            cornerFunction: (player) => {
                player.poolAmt -= 100;
            }
        });
        // Side 2 - 4 properties
        const side2Properties = [
            { name: "St. Charles Place", price: 140, rent: 20, imageURL: "/images/stcharles.png" },
            { name: "Electric Company", price: 150, rent: 25, imageURL: "/images/electric.png" },
            { name: "States Avenue", price: 140, rent: 20, imageURL: "/images/states.png" },
            { name: "Virginia Avenue", price: 160, rent: 25, imageURL: "/images/virginia.png" }
        ];
        side2Properties.forEach(prop => {
            board.push(Object.assign(Object.assign({}, prop), { owner: null, cornerBlock: false }));
        });
        // Corner 3 - Free Parking
        board.push({
            name: "Free Parking",
            imageURL: "/images/freeparking.png",
            cornerBlock: true,
            cornerFunction: (player) => {
                player.poolAmt -= 100;
            }
        });
        // Side 3 - 4 properties
        const side3Properties = [
            { name: "St. James Place", price: 180, rent: 30, imageURL: "/images/stjames.png" },
            { name: "Tennessee Avenue", price: 180, rent: 30, imageURL: "/images/tennessee.png" },
            { name: "New York Avenue", price: 200, rent: 35, imageURL: "/images/newyork.png" },
            { name: "Kentucky Avenue", price: 220, rent: 40, imageURL: "/images/kentucky.png" }
        ];
        side3Properties.forEach(prop => {
            board.push(Object.assign(Object.assign({}, prop), { owner: null, cornerBlock: false }));
        });
        // Corner 4 - Go to Jail
        board.push({
            name: "Go to Jail",
            imageURL: "/images/gotojail.png",
            cornerBlock: true,
            cornerFunction: (player) => {
                player.position = 5; // Move to jail
                player.poolAmt -= 100;
            }
        });
        // Side 4 - 4 properties
        const side4Properties = [
            { name: "Atlantic Avenue", price: 260, rent: 50, imageURL: "/images/atlantic.png" },
            { name: "Ventnor Avenue", price: 260, rent: 50, imageURL: "/images/ventnor.png" },
            { name: "Water Works", price: 150, rent: 25, imageURL: "/images/waterworks.png" },
            { name: "Marvin Gardens", price: 280, rent: 55, imageURL: "/images/marvin.png" }
        ];
        side4Properties.forEach(prop => {
            board.push(Object.assign(Object.assign({}, prop), { owner: null, cornerBlock: false }));
        });
        return board;
    }
    getBoard() {
        return this.blocks;
    }
    getBlock(position) {
        if (position >= 0 && position < this.blocks.length) {
            return this.blocks[position];
        }
        return null;
    }
    getBlockByName(name) {
        return this.blocks.find(block => block.name === name) || null;
    }
    getBoardLength() {
        return this.blocks.length;
    }
    isCornerBlock(position) {
        const block = this.getBlock(position);
        return block ? block.cornerBlock : false;
    }
    getPropertiesOwnedBy(playerId) {
        return this.blocks.filter(block => block.owner === playerId);
    }
    getUnownedProperties() {
        return this.blocks.filter(block => !block.cornerBlock && !block.owner);
    }
    resetBoard() {
        this.blocks.forEach(block => {
            if (!block.cornerBlock) {
                block.owner = null;
            }
        });
    }
    calculateRent(block) {
        if (block.rentfunction) {
            return block.rentfunction();
        }
        return block.rent || 50;
    }
    executeCornerFunction(block, player) {
        if (block.cornerFunction) {
            block.cornerFunction(player);
        }
    }
}
exports.Board = Board;
