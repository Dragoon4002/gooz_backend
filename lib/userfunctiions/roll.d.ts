declare function randomGenerator(wallet: any): Promise<{
    decimalValue: string;
    diceRolls: number[];
    requestID: bigint;
    nonce: bigint;
    randomness: import("ethers").BytesLike;
    signature: import("ethers").BytesLike;
}>;
export declare function roll(): Promise<number>;
export default randomGenerator;
export declare function rollDice(dice: string): number;
