import * as fs from 'fs';
import path from 'path';
import {MyLp, StableSwapPool, TokenRate} from '../types';
import {ApiPromise, WsProvider} from '@polkadot/api';
// const { ApiPromise, WsProvider } = ('@polkadot/api');
// const { options } = require('@acala-network/api');
import { options } from '@acala-network/api';
import { getApiForNode } from './../utils.ts';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const endpoint1 = 'wss://karura.api.onfinality.io/public-ws';
const endpoint2 = 'wss://karura-rpc-2.aca-api.network/ws';
const endpoint6 = 'wss://karura-rpc.dwellir.com'
const endpoint3 = 'wss://karura-rpc-0.aca-api.network'
const endpoint4 = 'wss://karura-rpc-1.aca-api.network'
const endpoint5 = 'wss://karura-rpc-2.aca-api.network/ws'
// wss://karura-rpc-3.aca-api.network/ws
const FEE_PRECISION = 10000000000
declare const fetch: any;
const localRpc = "ws://172.26.130.75:8008"
const liveRpc = endpoint2
export async function updateLps(chopsticks: boolean) {
    let api = await getApiForNode("Acala", chopsticks);
    await api.isReady;

    let number = await api.query.system.number();
    // console.log("Block number: ", number.toString());

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
    // api.disconnect()
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
        let poolId = key.args[0].toHuman();
        // console.log(`Pool ID: ${poolId}`)

        let valueData = value.toHuman() as any;
        let assets = valueData.assets;
        let tokenShares = valueData.balances;
        let a = valueData.a.replace(/,/g, "");
        let swapFee = valueData.swapFee.replace(/,/g, "");
        let aPrecision = 100;
        let poolAccount = valueData.accountId;
        let tokenRates = [1,1]

        // console.log(`Pool account: ${poolAccount}`)

        // console.log(`Liquidities: ${JSON.stringify(liquidity)}`)

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
        // console.log(`Queried assets: ${JSON.stringify(assets, null, 2)}`)
        // console.log(`Matched assets: ${JSON.stringify(matchedAssets, null, 2)}`)
        // let accountBalances = await api.query.tokens.accounts(poolAccount, matchedAssets);
        // console.log(`Account balances: ${JSON.stringify(accountBalances)}`)
        let tokenReserves: any[] = []
        for (let asset of assets) {
            let accountBalances = await api.query.tokens.accounts(poolAccount, asset);
            let tokenBalance = accountBalances.toHuman().free.toString().replace(/,/g, "");
            tokenReserves.push(tokenBalance)
        }
        tokenShares = tokenShares.map((shares: any) => {
            return shares.toString().replace(/,/g, "")
        })

        // console.log(`Token Reserves: ${JSON.stringify(tokenReserves)}`)
        // console.log(`Token Shares: ${JSON.stringify(tokenShares)}`)
        // let A;
        // let aPrecision = 100
        // Special handling for Ksm/Lksm pool
        // if (matchedAssets.length === 2) {
        //     let dotLdotBalances = await getDotLdotBalance(api);
        //     tokenShares.push(dotLdotBalances[0]); // Adding in order of tokens in pool, which is Dot then LDot
        //     tokenShares.push(dotLdotBalances[1]);
        //     tokenShares = tokenShares.map((l: any) => {
        //         return l.toString().replace(/,/g, "")
        //     })
        //     // A = 0.03 * aPrecision;
        // } else {
        //     tokenShares = tokenShares.map((l: any) => {
        //         return l.toString().replace(/,/g, "")
        //     })
        //     // A = 100 * aPrecision;
        // }
        let tokenPrecisions = valueData.precisions.map((p: any) => {
            return p.toString().replace(/,/g, "")
        })
        let formattedTokenRates = tokenRates.map((rate: any) => {
            let tokenRate: TokenRate = {
                numerator: "1000",
                denominator: "1000"
            }
            return tokenRate
        })
        let newStablePool: StableSwapPool = {
            chainId: parachainId.toJSON() as number,
            dexType: 'stable',
            poolId: "0",
            poolAssets: matchedAssets,
            liquidityStats: tokenReserves,
            tokenShares: tokenShares,
            tokenPrecisions: tokenPrecisions,
            tokenRates: formattedTokenRates,
            swapFee: swapFee,
            feePrecision: FEE_PRECISION.toString(),
            a: a,
            aPrecision: aPrecision,
            aBlock: valueData.aBlock.replace(/,/g, ""),
            futureA: valueData.futureA.replace(/,/g, ""),
            futureABlock: valueData.futureABlock.replace(/,/g, ""),
            totalSupply: valueData.totalSupply.replace(/,/g, ""),
            poolPrecision: valueData.precision.replace(/,/g, "")
        }
        // console.log(`New Stable Pool: ${JSON.stringify(newStablePool, null, 2)}`)
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
            let ksmRealLiq = await getDotLdotBalance(api);
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
            poolId: "0",
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

async function getDotLdotBalance(api: any) {
    // const provider = new WsProvider('wss://karura.api.onfinality.io/public-ws');
    // const api = new ApiPromise(options({ provider }));
    await api.isReady;
    const dotLdotPool = '23M5ttkp2zdM8qa6LFak4BySWZDsAVByjepAfr7kt929S1U9';
    const dot = {
        Token: "DOT"
    }
    const lDot = {
        Token: "LDOT"
    }
    let dotBalance = await api.query.tokens.accounts(dotLdotPool, dot);
    let lDotBalance = await api.query.tokens.accounts(dotLdotPool, lDot);
    let dotFormatted = dotBalance.toHuman().free.toString().replace(/,/g, "");
    let lDotFormatted = lDotBalance.toHuman().free.toString().replace(/,/g, "");
    return [dotFormatted, lDotFormatted]
}

async function main() {

    let api = await getApiForNode("Acala", false);
    // await updateLps(false);
    await updateStables(api);

    // process.exit(0)
}

// main()
