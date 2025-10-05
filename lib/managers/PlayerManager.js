"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerManager = void 0;
const crypto = require('crypto');
class PlayerManager {
    static createPlayer(name, webSocket, colorCode, playerId) {
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
    static generatePlayerId() {
        return crypto.randomBytes(8).toString('hex');
    }
    static generateRandomColor() {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    static sanitizePlayer(player) {
        return {
            id: player.id,
            name: player.name,
            poolAmt: player.poolAmt,
            ownedBlocks: player.ownedBlocks,
            colorCode: player.colorCode,
            position: player.position
        };
    }
    static movePlayer(player, diceRoll, boardLength) {
        const oldPosition = player.position;
        const newPosition = (oldPosition + diceRoll) % boardLength;
        const passedGo = newPosition < oldPosition || (oldPosition + diceRoll >= boardLength);
        player.position = newPosition;
        return { newPosition, passedGo };
    }
    static collectPassGoMoney(player, amount = 100) {
        player.poolAmt += amount;
    }
    static canAffordProperty(player, block) {
        const price = block.price || 0;
        const fee = Math.floor(price * 0.01);
        return player.poolAmt >= (price + fee);
    }
    static canAffordRent(player, rentAmount) {
        const fee = Math.floor(rentAmount * 0.01);
        return player.poolAmt >= (rentAmount + fee);
    }
    static buyProperty(player, block) {
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
    static sellProperty(player, block) {
        if (!player.ownedBlocks.includes(block.name)) {
            return 0;
        }
        const sellPrice = Math.floor((block.price || 0) / 2);
        const fee = Math.floor(sellPrice * 0.01);
        const netAmount = sellPrice - fee;
        player.poolAmt += netAmount;
        player.ownedBlocks = player.ownedBlocks.filter(b => b !== block.name);
        block.owner = null;
        return sellPrice;
    }
    static payRent(payer, owner, amount) {
        const fee = Math.floor(amount * 0.01);
        const totalCost = amount + fee;
        if (payer.poolAmt < totalCost) {
            return false;
        }
        payer.poolAmt -= totalCost;
        owner.poolAmt += amount;
        return true;
    }
    static ownsProperty(player, blockName) {
        return player.ownedBlocks.includes(blockName);
    }
    static getPlayerById(players, playerId) {
        return players.find(p => p.id === playerId);
    }
    static removePlayerFromGame(players, playerId) {
        return players.filter(p => p.id !== playerId);
    }
    static validatePlayerTurn(gameState, playerId) {
        if (!gameState.gameStarted)
            return false;
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        return currentPlayer && currentPlayer.id === playerId;
    }
    static getNextPlayerIndex(currentIndex, totalPlayers) {
        return (currentIndex + 1) % totalPlayers;
    }
    static isPlayerIdDuplicate(players, playerId) {
        return players.some(p => p.id === playerId);
    }
}
exports.PlayerManager = PlayerManager;
