import * as paraspell from '@paraspell/sdk';
import { ApiPromise } from '@polkadot/api';
export declare const ksmRpc = "wss://kusama-rpc.dwellir.com";
export declare function getApiForNode(node: paraspell.TNode | "Kusama", chopsticks: boolean): Promise<ApiPromise>;
export declare function deepEqual(obj1: any, obj2: any): boolean;
