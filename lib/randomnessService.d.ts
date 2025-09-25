export declare class RandomnessService {
    private primarySource;
    private fallbackSource;
    constructor(useChainlink?: boolean);
    rollDice(): Promise<{
        result: number;
        source: string;
        timestamp: number;
    }>;
    generateGameSeed(gameId: string): Promise<string>;
    getVerifiableRandom(gameId: string, round: number, playerIds: string[]): Promise<{
        randomValue: number;
        seed: string;
        proof: string;
    }>;
    validateRoll(gameId: string, round: number, playerIds: string[], expectedProof: string, seed: string): boolean;
}
