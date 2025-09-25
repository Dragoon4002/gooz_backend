import { type ContractRunner } from "ethers";
import type { ReentrancyGuard, ReentrancyGuardInterface } from "../ReentrancyGuard";
export declare class ReentrancyGuard__factory {
    static readonly abi: readonly [{
        readonly type: "error";
        readonly name: "ReentrancyGuardReentrantCall";
        readonly inputs: readonly [];
    }];
    static createInterface(): ReentrancyGuardInterface;
    static connect(address: string, runner?: ContractRunner | null): ReentrancyGuard;
}
