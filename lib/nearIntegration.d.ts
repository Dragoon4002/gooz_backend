export declare class NEARIntegration {
    private near;
    private contract;
    private account;
    private contractId;
    constructor(contractId?: string);
    initialize(): Promise<boolean>;
    stakeToPool(playerWalletId: string, amount: string): Promise<boolean>;
    withdrawFromPool(playerWalletId: string, amount: string): Promise<boolean>;
    getPlayerBalance(playerWalletId: string): Promise<string>;
    getPoolBalance(): Promise<string>;
    handlePlayerJoinWithStake(playerWalletId: string, stakeAmount?: string): Promise<boolean>;
    distributeWinnings(winners: {
        walletId: string;
        amount: string;
    }[]): Promise<boolean>;
}
