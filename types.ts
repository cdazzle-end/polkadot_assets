// import { Junction } from '@polkadot/types/interfaces'
// import { Keyring, ApiPromise, WsProvider } from '@polkadot/api'
// import { Junction, MultiLocation } from '@polkadot/types/interfaces'
// import { AnyJson } from '@polkadot/types-codec/types';
// // import * as bncHandler from './bnc/asset_handler'

//This is the interface for the asset registry object. Combines token metadata and token location
export interface MyAssetRegistryObject {
    tokenData: MyAsset | CexAsset,
    hasLocation: boolean,
    tokenLocation?: any
}

export interface CexAsset {
    exchange: string,
    assetTicker: string,
    name: string,
    chain: string,
    precision: number,
    contractAddress: string,
}

//This is the unifying interface for all asset from all chains
export interface MyAsset {
    network: "kusama" | "polkadot"
    chain: number,
    localId: any,
    name: string,
    symbol: string,
    decimals: string,
    minimalBalance?: string,
    isFrozen?: boolean,
    deposit?: string,
    contractAddress?: string,
}

//MultiLocations 
export interface MyMultiLocation {
    [index: string]: any
    
}



//Use this to help convert data into '@polkadot/types/interfaces/Junction' when having trouble with the api.createType() method
export interface MyJunction {
    [index: string]: any,
    Parent?: boolean,
    Parachain?: number,
    AccountId32?: {
        networkId: string,
        id: String
    }
    AccountIndex64?: {
        networkId: string,
        index: String
    }
    AccountKey20?: {
        network: string,
        key: string
    }
    PalletInstance?: number,
    GeneralIndex?: number,
    GeneralKey?: {
        length: number,
        data: string
    }
    OnlyChild?: boolean,
    Plurality?: {
        id: string,
        part: string
    }
}
export interface TickData {
    tick: string,
    liquidityTotal: string,
    liquidityDelta: string,
    intialized: boolean
}

export interface MyLp{
    chainId: number,
    dexType: string,
    contractAddress?: string,
    abi?: string,
    poolAssets: any[]
    liquidityStats: string[],
    feeRate?: string,
    currentTick?: string,
    activeLiquidity?: string,
    initializedTicks?: number[],
    lowerTicks?: TickData[],
    upperTicks?: TickData[],
}

export interface CexLp{
    exchange: string,
    assetTicker: string,
    price: [number, number],
    priceDecimals: [number, number],
}

export interface StableSwapPool{
    chainId: number,
    dexType: String,
    contractAddress?: string,
    poolAssets: any[],
    liquidityStats: string[],
    tokenPrecisions: string[],
    swapFee: string,
    a: number,
    aPrecision: number,
    aBlock: number,
    futureA: number,
    futureABlock: number,
    totalSupply: string,
    poolPrecision: string,
}

export interface GlobalState{
    price: string,
    tick: string,
    fee: string,
    timepointIndex: string,
    communityFeeToken0: string,
    communityFeeToken1: string,
    unlocked: boolean
}

export interface Slot0 {
    sqrtPriceX96: string,
    tick: string,
    observationIndex: string,
    observationCardinality: string,
    observationCardinalityNext: string,
    fee: string, //feeProtocol
    unlocked: boolean

}
export interface OmniPool{
    assetId: string,
    hubAmount: string,
    tokenAmount: string,
    assetAmount: string,
    protocolAmount: string,
    assetFee: string,
    protocolFee: string,
    cap: string,
}