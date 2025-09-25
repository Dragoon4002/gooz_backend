import { connect, Contract, KeyPair, keyStores, utils } from 'near-api-js';

interface GamePoolContract extends Contract {
  stake(args: {}, gas?: string, deposit?: string): Promise<void>;
  withdraw(args: { accountId: string; amount: string }, gas?: string): Promise<void>;
  get_user(args: { accountId: string }): Promise<{ balance: string } | null>;
  get_contract_balance(): Promise<string>;
}

export class NEARIntegration {
  private near: any;
  private contract: GamePoolContract | null = null;
  private account: any;
  private contractId: string;

  constructor(contractId: string = 'gamepool.testnet') {
    this.contractId = contractId;
  }

  async initialize() {
    try {
      const keyStore = new keyStores.InMemoryKeyStore();

      // Add your account key pair here
      // For production, use environment variables or secure key management
      const keyPair = KeyPair.fromString('ed25519:YOUR_PRIVATE_KEY_HERE');
      await keyStore.setKey('testnet', this.contractId, keyPair);

      const config = {
        networkId: 'testnet',
        keyStore: keyStore,
        nodeUrl: 'https://rpc.testnet.near.org',
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org',
      };

      this.near = await connect(config);
      this.account = await this.near.account(this.contractId);

      this.contract = new Contract(
        this.account,
        this.contractId,
        {
          viewMethods: ['get_user', 'get_contract_balance'],
          changeMethods: ['stake', 'withdraw'],
        }
      ) as GamePoolContract;

      console.log('NEAR integration initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize NEAR integration:', error);
      return false;
    }
  }

  async stakeToPool(playerWalletId: string, amount: string): Promise<boolean> {
    if (!this.contract) {
      console.error('NEAR contract not initialized');
      return false;
    }

    try {
      // In a real implementation, the player would call this from their wallet
      // For now, we'll simulate it by calling from the server account
      await this.contract.stake(
        {},
        '300000000000000', // 300 Tgas
        utils.format.parseNearAmount(amount) // Convert NEAR to yoctoNEAR
      );

      console.log(`Successfully staked ${amount} NEAR for player ${playerWalletId}`);
      return true;
    } catch (error) {
      console.error('Failed to stake to pool:', error);
      return false;
    }
  }

  async withdrawFromPool(playerWalletId: string, amount: string): Promise<boolean> {
    if (!this.contract) {
      console.error('NEAR contract not initialized');
      return false;
    }

    try {
      await this.contract.withdraw(
        {
          accountId: playerWalletId,
          amount: utils.format.parseNearAmount(amount)!
        },
        '300000000000000' // 300 Tgas
      );

      console.log(`Successfully withdrew ${amount} NEAR for player ${playerWalletId}`);
      return true;
    } catch (error) {
      console.error('Failed to withdraw from pool:', error);
      return false;
    }
  }

  async getPlayerBalance(playerWalletId: string): Promise<string> {
    if (!this.contract) {
      console.error('NEAR contract not initialized');
      return '0';
    }

    try {
      const user = await this.contract.get_user({ accountId: playerWalletId });
      if (user && user.balance) {
        return utils.format.formatNearAmount(user.balance);
      }
      return '0';
    } catch (error) {
      console.error('Failed to get player balance:', error);
      return '0';
    }
  }

  async getPoolBalance(): Promise<string> {
    if (!this.contract) {
      console.error('NEAR contract not initialized');
      return '0';
    }

    try {
      const balance = await this.contract.get_contract_balance();
      return utils.format.formatNearAmount(balance);
    } catch (error) {
      console.error('Failed to get pool balance:', error);
      return '0';
    }
  }

  // Simulate player joining with token swap (simplified)
  async handlePlayerJoinWithStake(playerWalletId: string, stakeAmount: string = '1'): Promise<boolean> {
    console.log(`Player ${playerWalletId} joining with ${stakeAmount} NEAR stake`);

    // In a real implementation, this would:
    // 1. Handle cross-chain token swapping to NEAR/Arbitrum
    // 2. Verify the swap transaction
    // 3. Stake the swapped amount to the pool

    return await this.stakeToPool(playerWalletId, stakeAmount);
  }

  // Handle game end - distribute winnings
  async distributeWinnings(winners: { walletId: string; amount: string }[]): Promise<boolean> {
    try {
      const results = await Promise.allSettled(
        winners.map(winner => this.withdrawFromPool(winner.walletId, winner.amount))
      );

      const successful = results.filter(result => result.status === 'fulfilled' && result.value);
      console.log(`Distributed winnings to ${successful.length}/${winners.length} winners`);

      return successful.length === winners.length;
    } catch (error) {
      console.error('Failed to distribute winnings:', error);
      return false;
    }
  }
}