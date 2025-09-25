import { Player, Block } from "../types";
export declare class PropertyManager {
    static handlePropertyLanding(player: Player, block: Block, players: Player[]): {
        action: 'buy_or_pass' | 'pay_rent' | 'own_property';
        rentInfo?: {
            owner: Player;
            rentAmount: number;
        };
    };
    static calculateRent(block: Block): number;
    static canBuyProperty(player: Player, block: Block): boolean;
    static buyProperty(player: Player, block: Block): boolean;
    static sellProperty(player: Player, block: Block): number;
    static handleRentPayment(payer: Player, owner: Player, block: Block): {
        success: boolean;
        rentAmount: number;
        insufficientFunds?: boolean;
    };
    static getPropertiesForSale(player: Player, blocks: Block[]): Block[];
    static calculatePropertyValue(block: Block): number;
    static getTotalPropertyValue(player: Player, blocks: Block[]): number;
    static canPayRentWithSales(player: Player, rentAmount: number, blocks: Block[]): boolean;
    static findPropertyByName(blocks: Block[], propertyName: string): Block | null;
    static isPropertyOwned(block: Block): boolean;
    static getPropertyOwner(block: Block, players: Player[]): Player | null;
    static transferProperty(from: Player, to: Player, block: Block): boolean;
    static resetProperty(block: Block): void;
    static getPlayerNetWorth(player: Player, blocks: Block[]): number;
}
