import * as fs from 'fs';
import path from 'path';
import {MyLp, StableSwapPool} from '../types';
import {ApiPromise, WsProvider} from '@polkadot/api';
// const { ApiPromise, WsProvider } = ('@polkadot/api');
// const { options } = require('@acala-network/api');
import { options } from '@acala-network/api';
// import { BigNumber } from 'bignumber.js';
import { getApiForNode } from './../utils.ts';
const endpoint1 = 'wss://karura.api.onfinality.io/public-ws';
const endpoint2 = 'wss://karura-rpc-2.aca-api.network/ws';
const endpoint6 = 'wss://karura-rpc.dwellir.com'
const endpoint3 = 'wss://karura-rpc-0.aca-api.network'
const endpoint4 = 'wss://karura-rpc-1.aca-api.network'
const endpoint5 = 'wss://karura-rpc-2.aca-api.network/ws'
// wss://karura-rpc-3.aca-api.network/ws

declare const fetch: any;
const localRpc = "ws://172.26.130.75:8008"
const liveRpc = endpoint2
export async function updateLps(chopsticks: boolean) {
    let api = await getApiForNode("Acala", chopsticks);
    await api.isReady;

    let stables = updateStables(api);
    const parachainId = await api.query.parachainInfo?.parachainId();
    const assetRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/asset_registry/aca_assets.json'), 'utf8')).map((asset: any) => {
        return asset.tokenData
    });

    //When running program locally
    // const assetRegistry = JSON.parse(fs.readFileSync('../../assets/kar/asset_registry.json', 'utf8')).map((asset: any) => {
    //     return asset.tokenData
    // });
    const lpEntries = await api.query.dex.liquidityPool.entries();
    const lps = lpEntries.map((lp: any) => {
        const lpAssetIds = lp[0].toHuman()[0];
        let liquidity = lp[1].toHuman();
        const tokens = lpAssetIds.map((lpAssetId: any) => {
            const matchedAsset = assetRegistry.find((asset: any) => {
                return Object.keys(lpAssetId)[0] === "ForeignAsset"
                    && Object.keys(asset.localId)[0] === "ForeignAssetId"
                    && Object.values(lpAssetId)[0] === Object.values(asset.localId)[0]
                    || Object.keys(lpAssetId)[0] === "Token"
                    && Object.keys(asset.localId)[0] === "NativeAssetId"
                    && Object.values(lpAssetId)[0] === (Object.values(asset.localId)[0] as any)["Token"]
                    || Object.keys(lpAssetId)[0] === "LiquidCrowdloan"
                    && Object.keys(asset.localId)[0] === "NativeAssetId"
                    && Object.values(lpAssetId)[0] === (Object.values(asset.localId)[0] as any)["LiquidCrowdloan"]
                    || Object.keys(lpAssetId)[0] === "StableAssetPoolToken"
                    && Object.keys(asset.localId)[0] === "StableAssetId"
                    && Object.values(lpAssetId)[0] === Object.values(asset.localId)[0]
                    || Object.keys(lpAssetId)[0] === "Erc20"
                    && Object.keys(asset.localId)[0] === "Erc20"
                    && Object.values(lpAssetId)[0] === Object.values(asset.localId)[0]
            })
            if (!matchedAsset) {
                throw new Error("No matching asset found for lpAssetId: " + JSON.stringify(lpAssetId));
            }
            return matchedAsset.localId;
        })
        liquidity = liquidity.map((l: any) => {
            return l.toString().replace(/,/g, "")
        })
        const newLp: MyLp = {
            chainId: parachainId.toJSON() as number,
            dexType: "solar",
            poolAssets: tokens,
            liquidityStats: liquidity
        }
        return newLp
    });
    
    // let stablePools = await queryStableLps(api);

    // fs.writeFileSync('./kar/stablePools.json', JSON.stringify(stablePools, null, 2))
    fs.writeFileSync(path.join(__dirname, './lp_registry/aca_lps.json'), JSON.stringify(lps, null, 2))
    await stables.then(() => console.log("aca stables complete"));
    api.disconnect()
}

async function saveLps() {
    // const provider = new WsProvider('wss://karura.api.onfinality.io/public-ws');
    // const api = new ApiPromise(options({ provider }));
    let api = await getApiForNode("Acala", false);
    await api.isReady;

    const parachainId = await api.query.parachainInfo?.parachainId();
    const assetRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/asset_registry/aca_assets.json'), 'utf8')).map((asset: any) => {
        return asset.tokenData
    });
    const lpEntries = await api.query.dex.liquidityPool.entries();
    // console.log(JSON.stringify(lpEntries, null, 2))
    const lps = lpEntries.map( (lp: any) => {
        // console.log(lp.toHuman())
        const lpAssetIds = lp[0].toHuman()[0];
        let liquidity = lp[1].toHuman();
        // let lpAssetIds = lpAssets.toHuman()[0];
        // let liquidity = liqCodec.toHuman();
        console.log(JSON.stringify(lpAssetIds))
        console.log(JSON.stringify(liquidity))
        const tokens = lpAssetIds.map((lpAssetId: any) => {
            console.log(`Matching asset for ${JSON.stringify(lpAssetId)}`)
            const matchedAsset = assetRegistry.find((asset: any) => {
                return Object.keys(lpAssetId)[0] === "ForeignAsset"
                    && Object.keys(asset.localId)[0] === "ForeignAssetId"
                    && Object.values(lpAssetId)[0] === Object.values(asset.localId)[0]
                    || Object.keys(lpAssetId)[0] === "Token"
                    && Object.keys(asset.localId)[0] === "NativeAssetId"
                    && Object.values(lpAssetId)[0] === (Object.values(asset.localId)[0] as any)["Token"]
                    || Object.keys(lpAssetId)[0] === "LiquidCrowdloan"
                    && Object.keys(asset.localId)[0] === "NativeAssetId"
                    && Object.values(lpAssetId)[0] === (Object.values(asset.localId)[0] as any)["LiquidCrowdloan"]
                    || Object.keys(lpAssetId)[0] === "StableAssetPoolToken"
                    && Object.keys(asset.localId)[0] === "StableAssetId"
                    && Object.values(lpAssetId)[0] === Object.values(asset.localId)[0]
                    || Object.keys(lpAssetId)[0] === "Erc20"
                    && Object.keys(asset.localId)[0] === "Erc20"
                    && Object.values(lpAssetId)[0] === Object.values(asset.localId)[0]
            })
            console.log(`Matched asset: ${JSON.stringify(matchedAsset)}`)
            return matchedAsset.localId
        })
        liquidity = liquidity.map((l: any) => {
            return l.toString().replace(/,/g, "")
        })
        const newLp: MyLp = {
            chainId: parachainId.toJSON() as number,
            dexType: "solar",
            poolAssets: tokens,
            liquidityStats: liquidity
        }
        return newLp
    });

    fs.writeFileSync(path.join(__dirname, './lp_registry/aca_lps.json'), JSON.stringify(lps, null, 2))
}

async function updateStables(api: any) {
    // const provider = new WsProvider('wss://karura.api.onfinality.io/public-ws');
    // const api = new ApiPromise(options({ provider }));
    // await api.isReady;

    const parachainId = await api.query.parachainInfo?.parachainId();
    const assetRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/asset_registry/aca_assets.json'), 'utf8')).map((asset: any) => {
        return asset.tokenData
    });
    const lpEntries = await api.query.stableAsset.pools.entries();
    let pools = await Promise.all(lpEntries.map(async ([key, value]: any) => {
        let valueData = value.toHuman() as any;
        let assets = valueData.assets;
        let liquidity = valueData.balances;

        let matchedAssets = assets.map((assetId: any) => {
            const matchedAsset = assetRegistry.find((asset: any) => {
                return Object.keys(assetId)[0] === "ForeignAsset"
                    && Object.keys(asset.localId)[0] === "ForeignAssetId"
                    && Object.values(assetId)[0] === Object.values(asset.localId)[0]
                    || Object.keys(assetId)[0] === "Token"
                    && Object.keys(asset.localId)[0] === "NativeAssetId"
                    && Object.values(assetId)[0] === (Object.values(asset.localId)[0] as any)["Token"]
                    || Object.keys(assetId)[0] === "StableAssetPoolToken"
                    && Object.keys(asset.localId)[0] === "StableAssetId"
                    && Object.values(assetId)[0] === Object.values(asset.localId)[0]
                    || Object.keys(assetId)[0] === "Erc20"
                    && Object.keys(asset.localId)[0] === "Erc20"
                    && Object.values(assetId)[0] === Object.values(asset.localId)[0]

            })
            // console.log(matchedAsset.localId)
            return matchedAsset.localId
        })
        let A;
        let aPrecision = 100
        // Special handling for Ksm/Lksm pool
        if (matchedAssets.length === 2) {
            let ksmLksmLiq = await getKsmLksmBalance(api);
            liquidity.push(ksmLksmLiq[0]);
            liquidity.push(ksmLksmLiq[1]);
            liquidity = liquidity.map((l: any) => {
                return l.toString().replace(/,/g, "")
            })
            A = 0.03 * aPrecision;
        } else {
            liquidity = liquidity.map((l: any) => {
                return l.toString().replace(/,/g, "")
            })
            A = 100 * aPrecision;
        }
        let tokenPrecisions = valueData.precisions.map((p: any) => {
            return p.toString().replace(/,/g, "")
        })
        let newStablePool: StableSwapPool = {
            chainId: parachainId.toJSON() as number,
            dexType: 'stable',
            poolAssets: matchedAssets,
            liquidityStats: liquidity,
            tokenPrecisions: tokenPrecisions,
            swapFee: valueData.swapFee.replace(/,/g, ""),
            a: A,
            aPrecision: aPrecision,
            aBlock: valueData.aBlock.replace(/,/g, ""),
            futureA: valueData.futureA.replace(/,/g, ""),
            futureABlock: valueData.futureABlock.replace(/,/g, ""),
            totalSupply: valueData.totalSupply.replace(/,/g, ""),
            poolPrecision: valueData.precision.replace(/,/g, "")
        }
        return newStablePool
    }));

    // console.log(pools)
    fs.writeFileSync(path.join(__dirname, './lp_registry/aca_stable_lps.json'), JSON.stringify(pools, null, 2))
    // return pools;
}

async function queryStableLps(api: any) {
    // const provider = new WsProvider('wss://karura.api.onfinality.io/public-ws');
    // const api = new ApiPromise(options({ provider }));
    // await api.isReady;
    
    const parachainId = await api.query.parachainInfo?.parachainId();
    const assetRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/asset_registry/aca_assets.json'), 'utf8')).map((asset: any) => {
        return asset.tokenData
    });
    const lpEntries = await api.query.stableAsset.pools.entries();
    let pools = await Promise.all(lpEntries.map(async ([key, value]: any) => {
        let valueData = value.toHuman() as any;
        let assets = valueData.assets;
        let liquidity = valueData.balances;

        let matchedAssets = assets.map((assetId: any) => {
            const matchedAsset = assetRegistry.find((asset: any) => {
                return Object.keys(assetId)[0] === "ForeignAsset"
                    && Object.keys(asset.localId)[0] === "ForeignAssetId"
                    && Object.values(assetId)[0] === Object.values(asset.localId)[0]
                    || Object.keys(assetId)[0] === "Token"
                    && Object.keys(asset.localId)[0] === "NativeAssetId"
                    && Object.values(assetId)[0] === (Object.values(asset.localId)[0] as any)["Token"]
                    || Object.keys(assetId)[0] === "StableAssetPoolToken"
                    && Object.keys(asset.localId)[0] === "StableAssetId"
                    && Object.values(assetId)[0] === Object.values(asset.localId)[0]
                    || Object.keys(assetId)[0] === "Erc20"
                    && Object.keys(asset.localId)[0] === "Erc20"
                    && Object.values(assetId)[0] === Object.values(asset.localId)[0]
                
            })
            // console.log(matchedAsset.localId)
            return matchedAsset.localId
        })
        let A;
        let aPrecision = 100
        // Special handling for Ksm/Lksm pool
        if (matchedAssets.length === 2) {
            let ksmRealLiq = await getKsmLksmBalance(api);
            liquidity.push(ksmRealLiq[0])
            liquidity.push(ksmRealLiq[1])
            liquidity = liquidity.map((l: any) => {
                return l.toString().replace(/,/g, "")
            })
            A = 0.03 * aPrecision;
        } else {
            liquidity = liquidity.map((l: any) => {
                return l.toString().replace(/,/g, "")
            })
            A = 100 * aPrecision;
        }
        let tokenPrecisions = valueData.precisions.map((p: any) => {
            return p.toString().replace(/,/g, "")
        })
        let newStablePool: StableSwapPool = {
            chainId: parachainId.toJSON() as number,
            dexType: 'stable',
            poolAssets: matchedAssets,
            liquidityStats: liquidity,
            tokenPrecisions: tokenPrecisions,
            swapFee: valueData.swapFee.replace(/,/g, ""),
            a: A,
            aPrecision: aPrecision,
            aBlock: valueData.aBlock.replace(/,/g, ""),
            futureA: valueData.futureA.replace(/,/g, ""),
            futureABlock: valueData.futureABlock.replace(/,/g, ""),
            totalSupply: valueData.totalSupply.replace(/,/g, ""),
            poolPrecision: valueData.precision.replace(/,/g, "")
        }
        return newStablePool
    }));

    // console.log(pools)
    fs.writeFileSync(path.join(__dirname, './lp_registry/aca_stable_lps.json'), JSON.stringify(pools, null, 2))
    return pools;
}



// async function getDexSwapAmount(pool:StableSwapPool, tokenIn: any, tokenOut: any, input: any) {
//     let poolBalances = pool.liquidityStats.map((balance: any) => {
//         return balance / 10 ** 12
//     })
//     console.log(poolBalances)
//     let increments = input / 100;

//     let totalOut = 0;
//     for (let i = 0; i < 100; i++) {
//         let out = poolBalances[tokenOut] * increments / (poolBalances[tokenIn] + increments);
//         let slip = (out / poolBalances[tokenOut]) * out;
//         totalOut += out - slip;
//         poolBalances[tokenOut] -= out - slip;
//         poolBalances[tokenIn] += increments;
//     }
//     console.log("Total out: " + totalOut);
//     // let kusdOut = kusdChangingLiq * rmrkInput / (rmrkChangingLiq + rmrkInput);
//     // let slip = (kusdOut / kusdChangingLiq) * kusdOut;
//     // totalKusd += kusdOut - slip;
//     // kusdChangingLiq -= kusdOut - slip;
//     // rmrkChangingLiq += rmrkInput;
//     // totalSlip += slip;

//     // i++;
// }

async function getKsmLksmBalance(api: any) {
    // const provider = new WsProvider('wss://karura.api.onfinality.io/public-ws');
    // const api = new ApiPromise(options({ provider }));
    await api.isReady;
    const ksmLksmPool = 'qmmNug1GQstpimAXBphJPSbDawH47vwMmhuSUq9xRqAsDAr';
    const ksm = {
        Token: "KSM"
    }
    const lksm = {
        Token: "LKSM"
    }
    let ksmBalance = await api.query.tokens.accounts(ksmLksmPool, ksm);
    let lksmBalance = await api.query.tokens.accounts(ksmLksmPool, lksm);
    // console.log(ksmBalance.toHuman())
    // console.log(lksmBalance.toJSON())
    let ksmFormatted = ksmBalance.toHuman().free.toString().replace(/,/g, "");
    let lksmFormatted = lksmBalance.toHuman().free.toString().replace(/,/g, "");
    // console.log(ksmFormatted)
    // console.log(lksmFormatted)
    return [ksmFormatted, lksmFormatted]
}

async function main() {

    let api = await getApiForNode("Acala", false);
    await queryStableLps(api)

    process.exit(0)
}
// main()
