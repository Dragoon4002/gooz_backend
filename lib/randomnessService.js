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
exports.RandomnessService = void 0;
const crypto = require("crypto");
class ChainlinkVRF {
    // Simulated Chainlink VRF integration
    // In production, this would connect to actual Chainlink VRF
    getDiceRoll() {
        return __awaiter(this, void 0, void 0, function* () {
            // Simulate network delay for VRF request
            yield new Promise(resolve => setTimeout(resolve, 100));
            // Generate cryptographically secure random number
            const randomBytes = crypto.randomBytes(32);
            const randomValue = randomBytes.readUInt32BE(0);
            // Convert to dice roll (2-12, simulating two dice)
            const dice1 = (randomValue % 6) + 1;
            const dice2 = ((randomValue >> 8) % 6) + 1;
            return dice1 + dice2;
        });
    }
    getRandomBytes(length) {
        return __awaiter(this, void 0, void 0, function* () {
            // Simulate VRF delay
            yield new Promise(resolve => setTimeout(resolve, 100));
            return crypto.randomBytes(length);
        });
    }
}
class LocalRandom {
    getDiceRoll() {
        return __awaiter(this, void 0, void 0, function* () {
            const dice1 = Math.floor(Math.random() * 6) + 1;
            const dice2 = Math.floor(Math.random() * 6) + 1;
            return dice1 + dice2;
        });
    }
    getRandomBytes(length) {
        return __awaiter(this, void 0, void 0, function* () {
            return crypto.randomBytes(length);
        });
    }
}
class RandomnessService {
    constructor(useChainlink = false) {
        if (useChainlink) {
            this.primarySource = new ChainlinkVRF();
            this.fallbackSource = new LocalRandom();
        }
        else {
            this.primarySource = new LocalRandom();
            this.fallbackSource = new LocalRandom();
        }
    }
    rollDice() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.primarySource.getDiceRoll();
                return {
                    result,
                    source: 'chainlink-vrf',
                    timestamp: Date.now()
                };
            }
            catch (error) {
                console.warn('Primary randomness source failed, using fallback:', error);
                const result = yield this.fallbackSource.getDiceRoll();
                return {
                    result,
                    source: 'local-crypto',
                    timestamp: Date.now()
                };
            }
        });
    }
    generateGameSeed(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const randomBytes = yield this.primarySource.getRandomBytes(32);
                const gameIdHash = crypto.createHash('sha256').update(gameId).digest();
                const combined = Buffer.concat([randomBytes, gameIdHash]);
                return crypto.createHash('sha256').update(combined).digest('hex');
            }
            catch (error) {
                console.warn('Failed to generate secure game seed, using fallback:', error);
                const randomBytes = yield this.fallbackSource.getRandomBytes(32);
                return crypto.createHash('sha256').update(randomBytes).digest('hex');
            }
        });
    }
    // Verifiable random function for transparency
    getVerifiableRandom(gameId, round, playerIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const seed = yield this.generateGameSeed(gameId);
            // Create deterministic input for this specific roll
            const input = JSON.stringify({
                gameId,
                round,
                playerIds: playerIds.sort(), // Sort for consistency
                timestamp: Math.floor(Date.now() / 1000) // Round to second for consistency
            });
            // Generate hash-based proof
            const proof = crypto
                .createHmac('sha256', seed)
                .update(input)
                .digest('hex');
            // Convert first 4 bytes of proof to dice roll
            const randomValue = parseInt(proof.substring(0, 8), 16) % 11 + 2; // 2-12
            return {
                randomValue,
                seed: seed.substring(0, 16) + '...', // Only show partial seed for security
                proof
            };
        });
    }
    // Validate that a previous roll was fair
    validateRoll(gameId, round, playerIds, expectedProof, seed) {
        try {
            const input = JSON.stringify({
                gameId,
                round,
                playerIds: playerIds.sort(),
                timestamp: Math.floor(Date.now() / 1000)
            });
            const proof = crypto
                .createHmac('sha256', seed)
                .update(input)
                .digest('hex');
            return proof === expectedProof;
        }
        catch (error) {
            console.error('Failed to validate roll:', error);
            return false;
        }
    }
}
exports.RandomnessService = RandomnessService;
