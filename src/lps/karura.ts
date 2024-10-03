import * as fs from 'fs';
import {MyLp, StableSwapPool} from '../types.ts'
// const { ApiPromise, WsProvider } = require('@polkadot/api');
import { ApiPromise, WsProvider } from '@polkadot/api';
// const { options } = require('@acala-network/api');
import { options } from '@acala-network/api';
import bn from 'bignumber.js' 
// import { getApiForNode } 
// import { bn } from 'bignumber.js';
import path from 'path';

import { fileURLToPath } from 'url';
import { getApiForNode } from '../utils.ts';
import { karAssetRegistry, karLpRegistry, karStableLpRegistry } from '../consts.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
    // let api = await getApiForNode("Karura", chopsticks);
    let api = await getApiForNode("Karura", chopsticks)

    // const api = await getApiForNode("Karura", chopsticks)
    // await api.isReady;

    let stables = updateStables(api);
    const parachainId = await api.query.parachainInfo?.parachainId();
    const assetRegistry = JSON.parse(fs.readFileSync(path.join(karAssetRegistry), 'utf8')).map((asset: any) => {
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

            // return matchedAsset.localId
        })
        liquidity = liquidity.map((l: any) => {
            return l.toString().replace(/,/g, "")
        })
        const newLp: MyLp = {
            chainId: parachainId.toJSON() as number,
            dexType: "V2",
            poolAssets: tokens,
            liquidityStats: liquidity
        }
        return newLp
    });
    
    // let stablePools = await queryStableLps(api);

    // fs.writeFileSync('./kar/stablePools.json', JSON.stringify(stablePools, null, 2))
    fs.writeFileSync(path.join(karLpRegistry), JSON.stringify(lps, null, 2))
    await stables.then(() => console.log("kar stables complete"));
    // api.disconnect()
}

async function saveLps() {
    let api = await getApiForNode("Karura", false);

    const parachainId = await api.query.parachainInfo?.parachainId();
    const assetRegistry = JSON.parse(fs.readFileSync(path.join(karAssetRegistry), 'utf8')).map((asset: any) => {
        return asset.tokenData
    });
    const lpEntries = await api.query.dex.liquidityPool.entries();
    const lps = lpEntries.map( (lp: any) => {
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
                    || Object.keys(lpAssetId)[0] === "StableAssetPoolToken"
                    && Object.keys(asset.localId)[0] === "StableAssetId"
                    && Object.values(lpAssetId)[0] === Object.values(asset.localId)[0]
                    || Object.keys(lpAssetId)[0] === "Erc20"
                    && Object.keys(asset.localId)[0] === "Erc20"
                    && Object.values(lpAssetId)[0] === Object.values(asset.localId)[0]
            })
            // console.log(matchedAsset.localId)
            return matchedAsset.localId
        })
        liquidity = liquidity.map((l: any) => {
            return l.toString().replace(/,/g, "")
        })
        const newLp: MyLp = {
            chainId: parachainId.toJSON() as number,
            dexType: "V2",
            poolAssets: tokens,
            liquidityStats: liquidity
        }
        return newLp
    });

    fs.writeFileSync(path.join(karLpRegistry), JSON.stringify(lps, null, 2))
}

async function updateStables(api: any) {
    // const provider = new WsProvider('wss://karura.api.onfinality.io/public-ws');
    // const api = new ApiPromise(options({ provider }));
    // await api.isReady;

    const parachainId = await api.query.parachainInfo?.parachainId();
    const assetRegistry = JSON.parse(fs.readFileSync(path.join(karAssetRegistry), 'utf8')).map((asset: any) => {
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
        // let A;
        let aPrecision = 100
        let poolId;
        // Special handling for Ksm/Lksm pool
        if (matchedAssets.length === 2) {
            poolId =0;
            let ksmLksmLiq = await getKsmLksmBalance(api);
            liquidity.push(ksmLksmLiq[0]);
            liquidity.push(ksmLksmLiq[1]);
            liquidity = liquidity.map((l: any) => {
                return l.toString().replace(/,/g, "")
            })
            // A = 0.03 * aPrecision;
        } else {
            poolId = 1
            liquidity = liquidity.map((l: any) => {
                return l.toString().replace(/,/g, "")
            })
            // A = 100 * aPrecision;
        }
        let tokenPrecisions = valueData.precisions.map((p: any) => {
            return p.toString().replace(/,/g, "")
        })
        let newStablePool: StableSwapPool = {
            chainId: parachainId.toJSON() as number,
            dexType: 'stable',
            poolId: poolId.toString(),
            poolAssets: matchedAssets,
            liquidityStats: liquidity,
            tokenPrecisions: tokenPrecisions,
            swapFee: valueData.swapFee.replace(/,/g, ""),
            a: valueData.a.replace(/,/g, ""),
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
    fs.writeFileSync(path.join(karStableLpRegistry), JSON.stringify(pools, null, 2))
    // return pools;
}

async function queryStableLps(api: any) {
    // const provider = new WsProvider('wss://karura.api.onfinality.io/public-ws');
    // const api = new ApiPromise(options({ provider }));
    // await api.isReady;
    
    const parachainId = await api.query.parachainInfo?.parachainId();
    const assetRegistry = JSON.parse(fs.readFileSync(karAssetRegistry, 'utf8')).map((asset: any) => {
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
    fs.writeFileSync(karStableLpRegistry, JSON.stringify(pools, null, 2))
    return pools;
}



async function getDexSwapAmount(pool:StableSwapPool, tokenIn: any, tokenOut: any, input: any) {
    let poolBalances = pool.liquidityStats.map((balance: any) => {
        return balance / 10 ** 12
    })
    console.log(poolBalances)
    let increments = input / 100;

    let totalOut = 0;
    for (let i = 0; i < 100; i++) {
        let out = poolBalances[tokenOut] * increments / (poolBalances[tokenIn] + increments);
        let slip = (out / poolBalances[tokenOut]) * out;
        totalOut += out - slip;
        poolBalances[tokenOut] -= out - slip;
        poolBalances[tokenIn] += increments;
    }
    console.log("Total out: " + totalOut);
    // let kusdOut = kusdChangingLiq * rmrkInput / (rmrkChangingLiq + rmrkInput);
    // let slip = (kusdOut / kusdChangingLiq) * kusdOut;
    // totalKusd += kusdOut - slip;
    // kusdChangingLiq -= kusdOut - slip;
    // rmrkChangingLiq += rmrkInput;
    // totalSlip += slip;

    // i++;
}

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

async function querySubscan() {
    // karura.api.subscan.io
    const apiKey = "6b15635a685849d2a0afb1b33754f73d";
    // 'https://statemine.api.subscan.io/api/scan/assets/assets'
    const url = 'https://karura.api.subscan.io/api/scan/accounts/tokens';
    const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
    };
    const data = {
        'address': 'sFbqBjxPBgfBmGPgxSWqweKLnHawKvMc9K1JNgcijAZjt1X'
        // row: 1,
        // page: 0
    };

    let response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    })
        .then((response: any) => response.json())
        .then((data: any) => console.log(data))
        .catch((error: any) => console.error(error));
}



async function testStableSwap() {
    // liquidityStats: ['1030529523909449995', '33112418564000000', '32952968957000000']
    let kusdLiquidity = 1030529523909449995;
    let usdcLiquidity = 33112418564000000;
    let usdtLiquidity = 32952968957000000;

    let inputTether = 10;
    let input = inputTether;
    console.log("Input tether: " + input)
    let increments = input / 10;
    input = increments - (increments * 0.003)
    let i = 0;
    let kusdChangingLiq = kusdLiquidity / (10 ** 12);
    let usdtChangingLiq = usdtLiquidity / (10 ** 12);
    let usdcChangingLiq = usdcLiquidity / (10 ** 12);
    let totalUsdChangingLiq = ((usdcLiquidity / (10 ** 12)) + (usdtLiquidity / (10 ** 12)))
    let totalKusd = 0;
    let totalSlip = 0

    // SUMxi = D
    // PRODUCTxi = (D/n)^n
    const sum = kusdChangingLiq + usdtChangingLiq + usdcChangingLiq;
    const prod = Math.pow((sum / 3), 3);
    const prod2 = kusdChangingLiq * usdtChangingLiq * usdcChangingLiq;
    console.log("SUM: " + sum)
    console.log("PRODUCT: " + prod)
    console.log("PRODUCT2: " + prod2)
}

// async function queryStableLps() {

// }
// async function swapKsmLksm(api: any) {
//     // let pools = await queryStableLps(api);
//     let pools = await readStables()
//     let ksmPool2 = await getKsmLksmBalance(api);
//     console.log(ksmPool2)
//     let ksmPool = pools[0];
//     let usdPool = pools[1];
//     // console.log(ksmPool);
//     // await getSwapAmount(usdPool, 0, 1, 50.34, 100)
//     // console.log("-----")
//     await getSwapAmount2(usdPool, 0, 1, 50.34, 100)
//     console.log("-----------------")
//     // await getSwapAmount(ksmPool, 0, 1, 0.863, 0.09)
//     // console.log("-----")
//     let out = await getSwapAmount2(ksmPool, 1, 0, 7.751364477999, 30)
//     // let out = await getSwapAmount2(ksmPool, 0, 1, 1, 30)
//     console.log(`LKSM pool 1 : ${ksmPool.liquidityStats[1]} pool 2: ${ksmPool2[1]}`)
//     let lksmRation = bn(ksmPool2[1]).div(bn(ksmPool.liquidityStats[1]))
//     // let totalOut = bn(out).div(lksmRation)
//     // let totalOutToLksm = lksmRation.times(bn(out))
//     let totalOutToKsm = bn(out).div(lksmRation)
//     console.log("Lksm Ratio: " + lksmRation)
//     console.log("Out LKSM: " + out)
//     console.log("Total Out: " + totalOutToKsm)
//     // getDexSwapAmount(ksmPool, 0, 1, 1)

// }

// async function getSwapAmount2(pool: StableSwapPool, tokenIn: number, tokenOut: number, input: number, A: number) {
//     let poolBalances = (pool.liquidityStats as any).map((liq: any) => {
//         // return liq / (10 ** 12)
//         return bn(liq)
//     });
//     let a = bn(A);
//     let dx = bn(input);
//     console.log("Pool Balances")
//     console.log(poolBalances)
//     let d = await getD2(poolBalances, A);
//     poolBalances[tokenIn] = poolBalances[tokenIn].plus(dx);
//     let y = getY2(poolBalances, tokenOut, d, a);
//     let dy = poolBalances[tokenOut].minus(y);
//     console.log("poolBalances[tokenOut]: " + poolBalances[tokenOut])
//     console.log("y                     : " + y)

//     let swapFee = bn(pool.swapFee.replace(/,/g, "") as any as number);
//     let feePrecisions = bn(10000000000);
//     let feeAmount = dy.times(swapFee).div(feePrecisions);
//     console.log("Fee: " + feeAmount)

//     poolBalances[tokenOut] = y
//     // totalOut += dy - feeAmount;
//     let totalOut = dy.minus(feeAmount);
//     console.log("Total out: " + totalOut)
//     return totalOut
// }

// async function getSwapAmount(pool: StableSwapPool, tokenIn: number, tokenOut: number, input: number, A: number) {
//     let poolBalances = (pool.liquidityStats as any).map((liq: any) => {
//         return liq / (10 ** 12)
//         // return liq
//     });
//     // let poolBalances = pool.liquidityStats;
//     console.log(poolBalances)
//     let sum = poolBalances.reduce((a: number, b: number) => a + b, 0);
//     console.log("D sum: " + sum)
//     // console.log("totalSupply: " + totalSupply)
//     // let A = .09;
//     // let A = 3000;
//     // let A = 100;
//     // let poolBalances = ksmL.map((liq: any) => {
//     //     return (liq.replace(/,/g, "")) / (10 ** 12)
//     // })

//     let swapFee = pool.swapFee.replace(/,/g, "") as any as number;
//     let feePrecisions = 10000000000;

//     let totalOut = 0;
//     let increments = 1;
//     let dx = input / increments;
//     for (let i = 0; i < increments; i++) {
//         // console.log("Input: " + dx)
//         // let balances = [kusdChangingLiq, usdcChangingLiq, usdtChangingLiq];
//         let balances = poolBalances;
//         // console.log(balances)
//         let D = getD(balances, A);
//         let D2 = sum;
//         console.log(D + " --- " + D2)
//         balances[tokenIn] = balances[tokenIn] + dx;
//         console.log(balances)
//         let y = getY(balances, tokenOut, D, A);
//         let dy = (balances[tokenOut] - y);

//         let feeAmount = dy * swapFee / feePrecisions;
//         console.log("Fee: " + feeAmount)

//         balances[tokenOut] = y
//         totalOut += dy - feeAmount;
//     }
//     console.log("Total Output: " + totalOut)

// }

async function main() {
    // const provider = new WsProvider('wss://karura.api.onfinality.io/public-ws');
    // const api = new ApiPromise(options({ provider }));
    // await api.isReady;
    // await saveLps()
    // await getLps()
    // await queryStableLps(api);
    // await swapKsmLksm(api);
    // await updateLps()
    await updateLps(false)

    process.exit(0)
}
// let A = 100.1;


function getD(balances: any, A: any) {
    let sum = 0;
    let i = 0;
    // let _A = 1;
    let Ann = A;
    
    for (i = 0; i < balances.length; i++) {
        sum = sum + balances[i];
        Ann = Ann * balances.length;
    }

    let prevD = 0;
    let D = sum;
    console.log("Start D: " + D);
    for (i = 0; i < 256; i++) {
        console.log("D: " + D)
        let pD = D;
        for (let j = 0; j < balances.length; j++) {
            // pD = pD * D / (_x * balance.length)
            pD = pD * D / (balances[j] * balances.length);
        }
        prevD = D
        // D = (Ann * sum + pD * balance.length) * D / ((Ann - 1) * D + (balance.length + 1) * pD)
        console.log(`Ann: ${Ann}, sum: ${sum}, pD: ${pD}, balances.length: ${balances.length}`)
        D = (Ann * sum + pD * balances.length) * D / ((Ann - 1) * D + (balances.length + 1) * pD);
        // console.log("D: " + D)
        if (D > prevD) {
            if (D - prevD <= 1) break;
        } else {
            if (prevD - D <= 1) break;
        }
    }
    return D;
}
function testSwap(){
    let inputIndex = 2 //USDT
    let outputIndex = 0 //KUSD
    let inputAmount = new bn(4998774) // 10
    let poolInfo = {
        balances: [
            new bn(853738653055275362), 
            new bn(38905179099000000), 
            new bn(30498687922000000)
        ],
        a: new bn(10000),
        aBlock: new bn(1913274),
        futureA: new bn(10000),
        futureABlock: new bn (1913274),
        totalSupply: new bn(914029567135413531),
        swapFee: new bn(5000000),
        precisions: [
            new bn(1),
            new bn(1000000),
            new bn(1000000)
        ]
        
    }

    let swapAmount = stableGetSwapAmount(poolInfo, inputIndex, outputIndex, inputAmount)
    let {dx, dy, y, balanceI} = swapAmount

    let balances = poolInfo.balances.map((b) => new bn(b) )
    balances[inputIndex] = balanceI,
    balances[outputIndex] = y!

    let dxFormatted = dx.div(new bn(10).pow(6))
    let dyFormatted = dy.div(new bn(10).pow(12))

    console.log(`${dxFormatted} USDT -> ${dyFormatted} KUSD`)
    console.log(`New Balances: ${balances.map((b) => b.toString() + " | ")}`)
}

function stableGetSwapAmount(poolInfo: any, inputIndex: number, outputIndex: number, inputAmount: bn){
    let zero = new bn(0)
    let one = new bn(1)
    // let mintFee = new bn(0)
    let swapFee = poolInfo.swapFee
    // let redeemFee = new bn(10000000)
    let totalSupply = poolInfo.totalSupply
    // let a = poolInfo.a
    // let aBlock = poolInfo.aBlock
    let futureA = poolInfo.futureA
    // let futureABlock = poolInfo.futureABlock
    let precisions = poolInfo.precisions
    let balances = poolInfo.balances
    
    
    // let precisions = [
    //     new bn(1),
    //     new bn(1000000),
    //     new bn(1000000)
    //   ]

    // GET SWAP AMOUNT(inputIndex, outputIndex, dxBalance)

    // GET A FUNCTION, always returns future A
    let swapA = futureA
    let swapD = totalSupply
    let feeRecipient = "qbK5taeJoMcwJoK3hZ7W8y2KkGu1iDRUvjrg9xQMsUKrrv7"
    let accountId = "qmmNug1GQstpimAXBpy3QzBL5cUWg2p6SeQzRWzRFhu8pfX"
    let yieldRecipient = "qbK5taeJoMcwJoK3hZ7W8y2KkGu1iDRUvjrg9xQMsUKrrv7"
    let precision = new bn(1000000000000)
    let feePrecision = new bn(10000000000) // CONST.stableAsset.feePrecision FEE PRECISION on chain
    let aPrecision = new bn(100) // CONST.stableAsset.aPrecision

    let swapBalances = balances.map((b) => new bn(b) )
    swapBalances[inputIndex] = swapBalances[inputIndex].plus(inputAmount.times(precisions[inputIndex]))

    let y = getYBN(swapBalances, outputIndex, swapD, swapA ) // Get Y function
    console.log(`Y: ${y}`)
    let dy = swapBalances[outputIndex].minus(y).minus(one)
        .div(precisions[outputIndex]);
    
    if (swapFee.gt(zero)) {
        const feeAmount = dy.times(swapFee).div(feePrecision);
        dy = dy.minus(feeAmount);
    }

    return {
        dx: new bn(inputAmount), // Assuming dx_bal is defined elsewhere. Replace `new BN(0)` with actual value
        dy: dy,
        y: y,
        balanceI: swapBalances[inputIndex],
    };
    
}
// Current block 6,397,339, WILL ALWAYS RETURN FUTURE A
function getA(poolA, poolABlock, futureA, futureABlock){
    let currentBlock = 0// Get current block
    let timeDiff;
    if(currentBlock < futureABlock){
        timeDiff = currentBlock - poolABlock
        let timeDiffDiv = futureABlock - poolABlock
        if(futureA > poolA){
            let diff = futureA - poolA
            let amount = diff * timeDiff / timeDiffDiv
            let returnValue = poolA + amount
        } else {
            let diff = poolA - futureA
            let amount = diff * timeDiff / timeDiffDiv
            let returnValue = poolA - amount
        }
    } else {
        let returnValue = futureA
    }
}

function getY(balances: any[], outputIndex, d, a){
    let c = d
    let sum = 0
    let ann = a
    const balanceSize = balances.length
    const targetD = d
    const aPrecision = 100

    for (let i = 0; i < balanceSize; i++){
        ann = ann * balanceSize
        if(i == outputIndex){
            continue
        }
        sum = sum + balances[i]
        c = c * targetD / (balances[i] * balanceSize)
    }

    // balances.forEach(([balance, i]) => {
    //     ann = ann * balanceSize
    //     if (i == outputIndex) {
    //         continue
    //     }
    //     sum = sum + balance
    //     c = c * targetD / (balance * balanceSize)
    // })
    c = c * targetD * aPrecision / (ann * balanceSize)
    // c = c
    //     .checked_mul(target_d_u256)?
    //     .checked_mul(a_precision_u256)?
    //     .checked_div(ann.checked_mul(balance_size)?)?;
    let b = sum + (targetD * aPrecision / ann)
    // let b: U512 = sum.checked_add(target_d_u256.checked_mul(a_precision_u256)?.checked_div(ann)?)?;
    let prevY;
    // let mut prev_y: U512;
    let y = targetD
    // let mut y: U512 = target_d_u256;

    let NUMBER_OF_ITERATIONS_TO_CONVERGE = 255

    for (let i = 0; i < NUMBER_OF_ITERATIONS_TO_CONVERGE; i++){
        prevY = y
        y = y * y + c / (y * 2 + b - targetD)
        if (y > prevY){
            if (y - prevY <= 1){
                break
            }
        } else if (prevY - y <= 1){
            break
        }
    }
    let result = y
    return result

}

function getYBN(
    balances: bn[],
    tokenIndex: number,
    targetD: bn,
    amplitude: bn
  ): bn | null {
    const one = new bn(1);
    const two = new bn(2);
    let c = new bn(targetD);
    let sum = new bn(0);
    let ann = new bn(amplitude);
    const balanceSize = new bn(balances.length);
    const targetDU512 = new bn(targetD);
    const aPrecisionU512 = new bn(100); // Replace with actual precision value if needed
    console.log(`C: ${c} | Sum: ${sum} | Ann: ${ann} | BalanceSize: ${balanceSize} | TargetDU512: ${targetDU512} | aPrecisionU512: ${aPrecisionU512}`)
  
    balances.forEach((balance, i) => {
      ann = ann.multipliedBy(balanceSize);
      if (i === tokenIndex) {
        return;
      }
      sum = sum.plus(balance);
      const divOp = balance.multipliedBy(balanceSize);
      c = c.multipliedBy(targetDU512).dividedBy(divOp);
    });
  
    c = c.multipliedBy(targetDU512).multipliedBy(aPrecisionU512).dividedBy(ann.multipliedBy(balanceSize));
    console.log("C: ", c.toString())
    const b = sum.plus(targetDU512.multipliedBy(aPrecisionU512).dividedBy(ann));
    let prevY = new bn(0);
    let y = targetDU512;
    console.log("B: ", b.toString())
    console.log("Y Start: ", y.toString())

    let NUMBER_OF_ITERATIONS_TO_CONVERGE = 255
    for (let i = 0; i < NUMBER_OF_ITERATIONS_TO_CONVERGE; i++) {
      prevY = y;
      y = y.multipliedBy(y).plus(c).dividedBy(y.multipliedBy(two).plus(b).minus(targetDU512));
      
      if (y.minus(prevY).abs().lte(one)) {
        break;
      }
    }
  
    return y.isNaN() ? null : y;
  }

// async function getD2(balances: any, A: any) {
//     let sum = bn(0);
//     let one = bn(1);
//     let i = 0;
//     // let _A = 1;
//     let Ann = bn(A);
//     let balance_size = bn(0);
//     console.log("A: " + A);
//     if (A == 30) {
//         balance_size = bn(balances.length - 2);
//         for (i = 0; i < balance_size.toNumber(); i++) {
//             sum = sum.plus(balances[i]);
//             Ann = Ann.times(balance_size);
//         }
//     } else {
//         balance_size = bn(balances.length);
//         for (i = 0; i < balance_size.toNumber(); i++) {
//             sum = sum.plus(balances[i]);
//             Ann = Ann.times(balance_size);
//         }
//     }
//     console.log("BALANCE SIZE: " + balance_size)
//     console.log("balance size: " + balance_size.toNumber())
    

//     let prevD = bn(0);
//     let D = sum;
//     console.log("Start D: " + D);
//     for (i = 0; i < 256; i++) {
//         console.log("D: " + D)
//         let pD = D;
//         for (let j = 0; j < balance_size.toNumber(); j++) {
//             // pD = pD * D / (_x * balance.length)
//             pD = pD.times(D).div(balances[j].times(balance_size));
//         }
//         // console.log("pD: " + pD)
//         prevD = D
//         // D = (Ann * sum + pD * balance.length) * D / ((Ann - 1) * D + (balance.length + 1) * pD)
        
//         let t_1 = Ann.times(sum).plus(pD.times(balance_size));
//         // console.log("t_1: " + t_1)
//         // console.log(`Ann: ${Ann}, One: 1, D: ${D}`)
//         let t_2 = Ann.minus(1).times(D)
//         // console.log("t_2: " + t_2)
//         let t_3 = balance_size.plus(1).times(pD)
//         // console.log("t_3: " + t_3)
//         let t_4 = t_2.plus(t_3)
//         // console.log("t_4: " + t_4)
//         let t_5 = t_1.times(D).div(t_4);
//         // console.log("t_5: " + t_5)

//         D = Ann.times(sum).plus(pD.times(balance_size)).times(D).div(Ann.minus(1).times(D).plus(balance_size.plus(1).times(pD)));
//         if (D.gt(prevD)) {
//             if (D.minus(prevD) <= one) break;
//         } else {
//             if (prevD.minus(D) <= one) break;
//         }
//     }
//     return D;
// }
// function getY2(balances: bn[], j: number, D: bn, A: any) {
//     let c = D;
//     let S = bn(0);
//     let Ann = A;
//     let one = bn(1);
//     let i = 0;
//     let balance_size = bn(0);

//     console.log("A y: " + A)
//     if (A == 30) {
//         balance_size = bn(balances.length - 2);
//         console.log("Balance size y: " + balance_size)
//         for (i = 0; i < balance_size.toNumber(); i++) {
//             Ann = Ann.times(balance_size);
//             if (i == j) continue
//             S = S.plus(balances[i]);
//             c = c.times(D).div(balances[i].times(balance_size));
//             console.log("c: " + c)
//         }
//     } else {
//         balance_size = bn(balances.length);
//         for (i = 0; i < balance_size.toNumber(); i++) {
//             Ann = Ann.times(balance_size);
//             if (i == j) continue
//             S = S.plus(balances[i]);
//             c = c.times(D).div(balances[i].times(balance_size));
//             console.log("c: " + c)
//         }
//     }
    
//     console.log("BALANCE SIze y: " + balance_size)
//     c = c.times(D).div(Ann.times(balance_size));
//     let b = S.plus(D.div(Ann));
//     let x = D.div(Ann);
//     console.log("Ann: " + Ann)
//     console.log("X: " + x)
//     let prevY = bn(0);
//     let y = D;
//     console.log(`c: ${c}, b: ${b}, y: ${y}`);
//     for (i = 0; i < 256; i++) {
//         prevY = y;
//         y = y.times(y).plus(c).div(y.times(2).plus(b).minus(D));
//         console.log("Y: " + y)
//         if (y.gt(prevY)) {
//             if (y.minus(prevY) <= one) break;
//         } else {
//             if (prevY.minus(y) <= one) break;
//         }
//     }
//     return y;
// }
// function getY(balances: any, j: number, D: number, A: number ) {
//     let c = D;
//     let S = 0;
//     let Ann = A;
//     let i = 0;

//     for (i = 0; i < balances.length; i++) {
//         Ann = Ann * balances.length;
//         if (i == j) continue
//         S = S + balances[i];
//         c = c * D / (balances[i] * balances.length);
//     }

//     c = c * D / (Ann * balances.length);
//     let b = S + D / Ann;
//     let prevY = 0;
//     let y = D;

//     for (i = 0; i < 256; i++) {
//         prevY = y;
//         y = (y * y + c) / (2 * y + b - D);
//         console.log("Y: " + y)
//         if (y > prevY) {
//             if (y - prevY <= 1) break;
//         }
//         else {
//             if (prevY - y <= 1) break;
//         }
//     }
//     return y;
// }

// main()
