import { MyAsset, MyAssetRegistryObject } from '../types.ts';
export declare function saveAssets(): Promise<void>;
export declare function getAssets(): Promise<MyAssetRegistryObject[]>;
export declare function queryTokenData(contractAddresses: string[], tokenAbi: any, provider: any): Promise<MyAsset[]>;
