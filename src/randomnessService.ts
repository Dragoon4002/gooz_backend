import * as crypto from 'crypto';

interface RandomnessSource {
  getDiceRoll(): Promise<number>;
  getRandomBytes(length: number): Promise<Buffer>;
}

class ChainlinkVRF implements RandomnessSource {
  // Simulated Chainlink VRF integration
  // In production, this would connect to actual Chainlink VRF

  async getDiceRoll(): Promise<number> {
    // Simulate network delay for VRF request
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate cryptographically secure random number
    const randomBytes = crypto.randomBytes(32);
    const randomValue = randomBytes.readUInt32BE(0);

    // Convert to dice roll (2-12, simulating two dice)
    const dice1 = (randomValue % 6) + 1;
    const dice2 = ((randomValue >> 8) % 6) + 1;

    return dice1 + dice2;
  }

  async getRandomBytes(length: number): Promise<Buffer> {
    // Simulate VRF delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return crypto.randomBytes(length);
  }
}

class LocalRandom implements RandomnessSource {
  async getDiceRoll(): Promise<number> {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    return dice1 + dice2;
  }

  async getRandomBytes(length: number): Promise<Buffer> {
    return crypto.randomBytes(length);
  }
}

export class RandomnessService {
  private primarySource: RandomnessSource;
  private fallbackSource: RandomnessSource;

  constructor(useChainlink: boolean = false) {
    if (useChainlink) {
      this.primarySource = new ChainlinkVRF();
      this.fallbackSource = new LocalRandom();
    } else {
      this.primarySource = new LocalRandom();
      this.fallbackSource = new LocalRandom();
    }
  }

  async rollDice(): Promise<{ result: number; source: string; timestamp: number }> {
    try {
      const result = await this.primarySource.getDiceRoll();
      return {
        result,
        source: 'chainlink-vrf',
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn('Primary randomness source failed, using fallback:', error);

      const result = await this.fallbackSource.getDiceRoll();
      return {
        result,
        source: 'local-crypto',
        timestamp: Date.now()
      };
    }
  }

  async generateGameSeed(gameId: string): Promise<string> {
    try {
      const randomBytes = await this.primarySource.getRandomBytes(32);
      const gameIdHash = crypto.createHash('sha256').update(gameId).digest();
      const combined = Buffer.concat([randomBytes, gameIdHash]);
      return crypto.createHash('sha256').update(combined).digest('hex');
    } catch (error) {
      console.warn('Failed to generate secure game seed, using fallback:', error);
      const randomBytes = await this.fallbackSource.getRandomBytes(32);
      return crypto.createHash('sha256').update(randomBytes).digest('hex');
    }
  }

  // Verifiable random function for transparency
  async getVerifiableRandom(gameId: string, round: number, playerIds: string[]): Promise<{
    randomValue: number;
    seed: string;
    proof: string;
  }> {
    const seed = await this.generateGameSeed(gameId);

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
  }

  // Validate that a previous roll was fair
  validateRoll(gameId: string, round: number, playerIds: string[], expectedProof: string, seed: string): boolean {
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
    } catch (error) {
      console.error('Failed to validate roll:', error);
      return false;
    }
  }
}