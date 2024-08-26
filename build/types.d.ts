export type Relay = 'polkadot' | 'kusama';
export interface MyAssetRegistryObject {
    tokenData: MyAsset | CexAsset;
    hasLocation: boolean;
    tokenLocation?: any;
}
export interface CexAsset {
    exchange: string;
    assetTicker: string;
    name: string;
    chain: string;
    precision: number;
    contractAddress: string;
}
export interface MyAsset {
    network: "kusama" | "polkadot";
    chain: number;
    localId: any;
    name: string;
    symbol: string;
    decimals: string;
    minimalBalance?: string;
    isFrozen?: boolean;
    deposit?: string;
    contractAddress?: string;
}
export interface MyMultiLocation {
    [index: string]: any;
}
export interface MyJunction {
    [index: string]: any;
    Parent?: boolean;
    Parachain?: number;
    AccountId32?: {
        networkId: string;
        id: String;
    };
    AccountIndex64?: {
        networkId: string;
        index: String;
    };
    AccountKey20?: {
        network: string;
        key: string;
    };
    PalletInstance?: number;
    GeneralIndex?: number;
    GeneralKey?: {
        length: number;
        data: string;
    };
    OnlyChild?: boolean;
    Plurality?: {
        id: string;
        part: string;
    };
}
export interface TickData {
    tick: string;
    liquidityTotal: string;
    liquidityDelta: string;
    intialized: boolean;
}
export interface MyLp {
    chainId: number;
    dexType: string;
    contractAddress?: string;
    abi?: string;
    poolAssets: any[];
    liquidityStats: string[];
    feeRate?: string;
    currentTick?: string;
    activeLiquidity?: string;
    initializedTicks?: number[];
    lowerTicks?: TickData[];
    upperTicks?: TickData[];
}
export interface CexLp {
    exchange: string;
    assetTicker: string;
    price: [number, number];
    priceDecimals: [number, number];
}
export interface TokenRate {
    numerator: string;
    denominator: string;
}
export interface StableSwapPool {
    chainId: number;
    dexType: String;
    poolId?: string;
    shareIssuance?: string;
    contractAddress?: string;
    poolAssets: any[];
    tokenRates?: TokenRate[];
    tokenShares?: string[];
    liquidityStats: string[];
    tokenPrecisions: string[];
    swapFee: string;
    feePrecision?: string;
    a: number;
    aPrecision: number;
    aBlock: string;
    futureA: string;
    futureABlock: string;
    totalSupply: string;
    poolPrecision: string;
}
export interface GlobalState {
    price: string;
    tick: string;
    fee: string;
    timepointIndex: string;
    communityFeeToken0: string;
    communityFeeToken1: string;
    unlocked: boolean;
}
export interface Slot0 {
    sqrtPriceX96: string;
    tick: string;
    observationIndex: string;
    observationCardinality: string;
    observationCardinalityNext: string;
    fee: string;
    unlocked: boolean;
}
export interface OmniPool {
    assetId: string;
    hubAmount: string;
    tokenAmount: string;
    assetAmount: string;
    protocolAmount: string;
    assetFee: string;
    protocolFee: string;
    cap: string;
}
