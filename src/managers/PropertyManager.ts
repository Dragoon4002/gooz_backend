import { Player, Block } from "../types";
import { PlayerManager } from "./PlayerManager";
import { PROPERTY_SELL_RATE } from "../constants";

export class PropertyManager {
    static handlePropertyLanding(player: Player, block: Block, players: Player[]): {
        action: 'buy_or_pass' | 'pay_rent' | 'own_property';
        rentInfo?: { owner: Player; rentAmount: number };
    } {
        // Property owned by someone else
        if (block.owner && block.owner !== player.id) {
            const owner = PlayerManager.getPlayerById(players, block.owner);
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

    static calculateRent(block: Block): number {
        if (block.rentfunction) {
            return block.rentfunction();
        }
        return block.rent || 50;
    }

    static canBuyProperty(player: Player, block: Block): boolean {
        return PlayerManager.canAffordProperty(player, block) && !block.owner;
    }

    static buyProperty(player: Player, block: Block): boolean {
        if (!PropertyManager.canBuyProperty(player, block)) {
            return false;
        }

        return PlayerManager.buyProperty(player, block);
    }

    static sellProperty(player: Player, block: Block): number {
        return PlayerManager.sellProperty(player, block);
    }

    static handleRentPayment(payer: Player, owner: Player, block: Block): {
        success: boolean;
        rentAmount: number;
        insufficientFunds?: boolean;
    } {
        const rentAmount = PropertyManager.calculateRent(block);

        if (PlayerManager.canAffordRent(payer, rentAmount)) {
            const success = PlayerManager.payRent(payer, owner, rentAmount);
            return { success, rentAmount };
        }

        return {
            success: false,
            rentAmount,
            insufficientFunds: true
        };
    }

    static getPropertiesForSale(player: Player, blocks: Block[]): Block[] {
        return blocks.filter(block =>
            PlayerManager.ownsProperty(player, block.name) &&
            !block.cornerBlock
        );
    }

    static calculatePropertyValue(block: Block): number {
        return Math.floor((block.price || 0) * PROPERTY_SELL_RATE);
    }

    static getTotalPropertyValue(player: Player, blocks: Block[]): number {
        const ownedProperties = PropertyManager.getPropertiesForSale(player, blocks);
        return ownedProperties.reduce((total, block) => {
            return total + PropertyManager.calculatePropertyValue(block);
        }, 0);
    }

    static canPayRentWithSales(player: Player, rentAmount: number, blocks: Block[]): boolean {
        const currentMoney = player.poolAmt;
        const totalPropertyValue = PropertyManager.getTotalPropertyValue(player, blocks);
        return (currentMoney + totalPropertyValue) >= rentAmount;
    }

    static findPropertyByName(blocks: Block[], propertyName: string): Block | null {
        return blocks.find(block => block.name === propertyName) || null;
    }

    static isPropertyOwned(block: Block): boolean {
        return !!block.owner;
    }

    static getPropertyOwner(block: Block, players: Player[]): Player | null {
        if (!block.owner) return null;
        return PlayerManager.getPlayerById(players, block.owner) || null;
    }

    static transferProperty(from: Player, to: Player, block: Block): boolean {
        if (!PlayerManager.ownsProperty(from, block.name)) {
            return false;
        }

        // Remove from current owner
        from.ownedBlocks = from.ownedBlocks.filter(b => b !== block.name);

        // Add to new owner
        to.ownedBlocks.push(block.name);
        block.owner = to.id;

        return true;
    }

    static resetProperty(block: Block): void {
        if (!block.cornerBlock) {
            block.owner = null;
        }
    }

    static getPlayerNetWorth(player: Player, blocks: Block[]): number {
        const cash = player.poolAmt;
        const propertyValue = PropertyManager.getTotalPropertyValue(player, blocks) * 2; // Property worth is double the sell value
        return cash + propertyValue;
    }
}