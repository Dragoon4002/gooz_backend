"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyManager = void 0;
const PlayerManager_1 = require("./PlayerManager");
class PropertyManager {
    static handlePropertyLanding(player, block, players) {
        // Property owned by someone else
        if (block.owner && block.owner !== player.id) {
            const owner = PlayerManager_1.PlayerManager.getPlayerById(players, block.owner);
            if (owner) {
                const rentAmount = PropertyManager.calculateRent(block);
                return {
                    action: 'pay_rent',
                    rentInfo: { owner, rentAmount }
                };
            }
        }
        // Unowned property
        if (!block.owner) {
            return { action: 'buy_or_pass' };
        }
        // Own the property
        return { action: 'own_property' };
    }
    static calculateRent(block) {
        if (block.rentfunction) {
            return block.rentfunction();
        }
        return block.rent || 50;
    }
    static canBuyProperty(player, block) {
        return PlayerManager_1.PlayerManager.canAffordProperty(player, block) && !block.owner;
    }
    static buyProperty(player, block) {
        if (!PropertyManager.canBuyProperty(player, block)) {
            return false;
        }
        return PlayerManager_1.PlayerManager.buyProperty(player, block);
    }
    static sellProperty(player, block) {
        return PlayerManager_1.PlayerManager.sellProperty(player, block);
    }
    static handleRentPayment(payer, owner, block) {
        const rentAmount = PropertyManager.calculateRent(block);
        if (PlayerManager_1.PlayerManager.canAffordRent(payer, rentAmount)) {
            const success = PlayerManager_1.PlayerManager.payRent(payer, owner, rentAmount);
            return { success, rentAmount };
        }
        return {
            success: false,
            rentAmount,
            insufficientFunds: true
        };
    }
    static getPropertiesForSale(player, blocks) {
        return blocks.filter(block => PlayerManager_1.PlayerManager.ownsProperty(player, block.name) &&
            !block.cornerBlock);
    }
    static calculatePropertyValue(block) {
        return Math.floor((block.price || 0) / 2); // Sell for half price
    }
    static getTotalPropertyValue(player, blocks) {
        const ownedProperties = PropertyManager.getPropertiesForSale(player, blocks);
        return ownedProperties.reduce((total, block) => {
            return total + PropertyManager.calculatePropertyValue(block);
        }, 0);
    }
    static canPayRentWithSales(player, rentAmount, blocks) {
        const currentMoney = player.poolAmt;
        const totalPropertyValue = PropertyManager.getTotalPropertyValue(player, blocks);
        return (currentMoney + totalPropertyValue) >= rentAmount;
    }
    static findPropertyByName(blocks, propertyName) {
        return blocks.find(block => block.name === propertyName) || null;
    }
    static isPropertyOwned(block) {
        return !!block.owner;
    }
    static getPropertyOwner(block, players) {
        if (!block.owner)
            return null;
        return PlayerManager_1.PlayerManager.getPlayerById(players, block.owner) || null;
    }
    static transferProperty(from, to, block) {
        if (!PlayerManager_1.PlayerManager.ownsProperty(from, block.name)) {
            return false;
        }
        // Remove from current owner
        from.ownedBlocks = from.ownedBlocks.filter(b => b !== block.name);
        // Add to new owner
        to.ownedBlocks.push(block.name);
        block.owner = to.id;
        return true;
    }
    static resetProperty(block) {
        if (!block.cornerBlock) {
            block.owner = null;
        }
    }
    static getPlayerNetWorth(player, blocks) {
        const cash = player.poolAmt;
        const propertyValue = PropertyManager.getTotalPropertyValue(player, blocks) * 2; // Property worth is double the sell value
        return cash + propertyValue;
    }
}
exports.PropertyManager = PropertyManager;
