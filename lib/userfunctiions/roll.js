"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roll = roll;
exports.rollDice = rollDice;
const ethers_1 = require("ethers");
const randomness_js_1 = require("randomness-js");
// Set up your ethers provider and wallet
const rpc = new ethers_1.JsonRpcProvider("https://sepolia.base.org");
const wallet = new ethers_1.Wallet("07ab3b4cb19f3f105efc697d1281cdd569c2053b1e0d2c577ef7102c8a0874a4", rpc);
// Global state for dice rolls
let diceRollsList = [];
let rollIndex = 0;
function randomGenerator(wallet) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create an instance using Base Sepolia testnet
        const randomness = randomness_js_1.Randomness.createBaseSepolia(wallet);
        const response = yield randomness.requestRandomness();
        // Convert hex randomness to decimal
        const decimalValue = BigInt(response.randomness.toString());
        // Generate dice rolls array (1-6) from the big integer
        const diceRolls = [];
        let n = decimalValue;
        while (diceRolls.length < 99 && n > BigInt(0)) {
            diceRolls.push(Number(n % BigInt(6)) + 1);
            n = n / BigInt(6);
        }
        // If we don't have enough rolls from the random value, fill with additional random values
        while (diceRolls.length < 99) {
            diceRolls.push(Math.floor(Math.random() * 6) + 1);
        }
        return Object.assign(Object.assign({}, response), { decimalValue: decimalValue.toString(), diceRolls: diceRolls.slice(0, 99) // Ensure exactly 99 rolls
         });
    });
}
function initializeDiceRolls() {
    return __awaiter(this, void 0, void 0, function* () {
        if (diceRollsList.length === 0) {
            const result = yield randomGenerator(wallet);
            diceRollsList = result.diceRolls;
            rollIndex = 0;
        }
    });
}
function roll() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initializeDiceRolls();
        if (rollIndex >= 99) {
            // Regenerate the list when exhausted
            const result = yield randomGenerator(wallet);
            diceRollsList = result.diceRolls;
            rollIndex = 0;
        }
        const diceValue = diceRollsList[rollIndex];
        rollIndex++;
        return diceValue;
    });
}
exports.default = randomGenerator;
function rollDice(dice) {
    const [numDice, numSides] = dice.split("d").map(Number);
    let total = 0;
    for (let i = 0; i < numDice; i++) {
        total += Math.floor(Math.random() * numSides) + 1;
    }
    return total;
}
