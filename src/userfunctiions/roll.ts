import { JsonRpcProvider, Wallet } from "ethers";
import { Randomness } from "randomness-js";

// Set up your ethers provider and wallet
const rpc = new JsonRpcProvider("https://sepolia.base.org");
const wallet = new Wallet("07ab3b4cb19f3f105efc697d1281cdd569c2053b1e0d2c577ef7102c8a0874a4", rpc);

// Global state for dice rolls
let diceRollsList: number[] = [];
let rollIndex: number = 0;

async function randomGenerator(wallet: any) {
    // Create an instance using Base Sepolia testnet
    const randomness = Randomness.createBaseSepolia(wallet);
    const response = await randomness.requestRandomness();

    // Convert hex randomness to decimal
    const decimalValue = BigInt(response.randomness.toString());

    // Generate dice rolls array (1-6) from the big integer
    const diceRolls: number[] = [];
    let n = decimalValue;
    while (diceRolls.length < 99 && n > BigInt(0)) {
        diceRolls.push(Number(n % BigInt(6)) + 1);
        n = n / BigInt(6);
    }
    // If we don't have enough rolls from the random value, fill with additional random values
    while (diceRolls.length < 99) {
        diceRolls.push(Math.floor(Math.random() * 6) + 1);
    }

    return {
        ...response,
        decimalValue: decimalValue.toString(),
        diceRolls: diceRolls.slice(0, 99) // Ensure exactly 99 rolls
    };
}

async function initializeDiceRolls() {
    if (diceRollsList.length === 0) {
        const result = await randomGenerator(wallet);
        diceRollsList = result.diceRolls;
        rollIndex = 0;
    }
}

export async function roll(): Promise<number> {
    await initializeDiceRolls();

    if (rollIndex >= 99) {
        // Regenerate the list when exhausted
        const result = await randomGenerator(wallet);
        diceRollsList = result.diceRolls;
        rollIndex = 0;
    }

    const diceValue = diceRollsList[rollIndex];
    rollIndex++;
    return diceValue;
}

export default randomGenerator;

export function rollDice(dice: string): number {
    const [numDice, numSides] = dice.split("d").map(Number);
    let total = 0;
    for (let i = 0; i < numDice; i++) {
        total += Math.floor(Math.random() * numSides) + 1;
    }
    return total;
}