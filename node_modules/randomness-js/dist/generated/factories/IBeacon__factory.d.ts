import { type ContractRunner } from "ethers";
import type { IBeacon, IBeaconInterface } from "../IBeacon";
export declare class IBeacon__factory {
    static readonly abi: readonly [{
        readonly type: "function";
        readonly name: "implementation";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly name: "";
            readonly type: "address";
            readonly internalType: "address";
        }];
        readonly stateMutability: "view";
    }];
    static createInterface(): IBeaconInterface;
    static connect(address: string, runner?: ContractRunner | null): IBeacon;
}
