import { type ContractRunner } from "ethers";
import type { Proxy, ProxyInterface } from "../Proxy";
export declare class Proxy__factory {
    static readonly abi: readonly [{
        readonly type: "fallback";
        readonly stateMutability: "payable";
    }];
    static createInterface(): ProxyInterface;
    static connect(address: string, runner?: ContractRunner | null): Proxy;
}
