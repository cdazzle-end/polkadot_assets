import * as fs from 'fs';
import path from 'path';
import { MyJunction, TokenData, IMyAsset, MyMultiLocation, MyLp } from '../types.ts';


// const axios = require('axios').default;
import axios from 'axios';
import { WsProvider, Keyring, ApiPromise } from '@polkadot/api';
import { ModuleBApi, BifrostConfig } from '@zenlink-dex/sdk-api';
import { Percent, Token, TokenAmount, TradeType, StandardPair, StandardPool, StablePair, StableSwap,  AssetMeta } from '@zenlink-dex/sdk-core';
import { firstValueFrom } from 'rxjs';

import { fileURLToPath } from 'url';
import { bncKusamaAssetRegistry, bncKusamaLpRegistry } from '../consts.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localRpc = "ws://172.26.130.75:8009"
const liveRpc = BifrostConfig.wss[0]
const rpc2 = "wss://bifrost-rpc.dwellir.com"

export async function updateLps(chopsticks: boolean) {
    // console.log("UPDATING BIFROST KUSAMA")

    // console.log("LIVE RPC: " + liveRpc)
    let rpc = chopsticks ? localRpc : liveRpc
    const provider = new WsProvider(rpc2);
    await provider.isReady;
    const dexApi = new ModuleBApi(
        provider,
        BifrostConfig
    );
    await dexApi.initApi();
    // console.log("BIFROST KUSAMA API INITIALIZED")
    const response = await axios.get('https://raw.githubusercontent.com/zenlinkpro/token-list/main/tokens/bifrost-kusama.json');
    const tokensMeta = response.data.tokens;

    const zenTokens = tokensMeta.map((item: AssetMeta) => {
        return new Token(item);
    });
    const bncAssets = JSON.parse(fs.readFileSync(bncKusamaAssetRegistry, 'utf8'))

    const standardPairs = await firstValueFrom(dexApi.standardPairOfTokens(zenTokens));
    const standardPools = await firstValueFrom(dexApi.standardPoolOfPairs(standardPairs));
    // console.log("STANDARD POOLS")
    const lps = standardPools.map((pool: any) => {
        let token0Symbol = pool.tokenAmounts[0].token.symbol
        let token1Symbol = pool.tokenAmounts[1].token.symbol
        if (token0Symbol.toLowerCase() == "ausd") {
            token0Symbol = "KUSD"
        }
        if (token1Symbol.toLowerCase() == "ausd") {
            token1Symbol = "KUSD"
        }
        const token0 = bncAssets.find((asset: any) => {
            return asset.tokenData.symbol == token0Symbol
        })
        const token1 = bncAssets.find((asset: any) => {
            return asset.tokenData.symbol == token1Symbol
        })
        const newLp: MyLp = {
            chainId: 2001,
            dexType: "V2",
            poolAssets: [token0?.tokenData.localId, token1?.tokenData.localId],
            liquidityStats: [pool.reserve0.numerator.toString(), pool.reserve1.numerator.toString()]
        }
        return newLp
    })
    await fs.writeFileSync(bncKusamaLpRegistry, JSON.stringify(lps, null, 2));
    // console.log("BIFROST KUSAMA LPS UPDATED")
    // dexApi.api?.disconnect();
    // console.log("DISCONNECTED FROM BIFROST KUSAMA")
}

// export async function saveLps() {
//     // const provider = new WsProvider('wss://heiko-rpc.parallel.fi');
//     // const api = new ApiPromise(options({ provider }));
//     // await api.isReady;
//     const provider = new WsProvider(BifrostConfig.wss[0]);
//     await provider.isReady;
//     const dexApi = new ModuleBApi(
//         provider,
//         BifrostConfig
//     );
//     await dexApi.initApi(); // init the api;
//     const response = await axios.get('https://raw.githubusercontent.com/zenlinkpro/token-list/main/tokens/bifrost-kusama.json');
//     const tokensMeta = response.data.tokens;
//     // console.log(tokensMeta)

//     const zenTokens = tokensMeta.map((item: AssetMeta) => {
//         return new Token(item);
//     });
//     const filePath = path.join(__dirname, '../../assets/bnc/asset_registry.json');
//     // fs.writeFileSync(filePath, JSON.stringify(assetRegistry, null, 2))
//     const bncAssets = JSON.parse(fs.readFileSync(filePath, 'utf8'))

//     // console.log(zenTokens.name + " " + zenTokens.symbol)
//     zenTokens.forEach((token: any) => {
//         console.log(token.name + " " + token.symbol)
//     })
//     console.log("---------------------")
//     const standardPairs = await firstValueFrom(dexApi.standardPairOfTokens(zenTokens));
//     const standardPools = await firstValueFrom(dexApi.standardPoolOfPairs(standardPairs));
//     const lps = standardPools.map((pool: any) => {
//         console.log("--")
//         console.log(pool.tokenAmounts[0].token.name + " " + pool.tokenAmounts[0].token.symbol)
//         console.log(pool.tokenAmounts[1].token.name + " " + pool.tokenAmounts[1].token.symbol)
//         let token0Symbol = pool.tokenAmounts[0].token.symbol
//         let token1Symbol = pool.tokenAmounts[1].token.symbol
//         let reserve0 = pool.reserve0.numerator.toString()
//         let reserve1 = pool.reserve1.numerator.toString()
//         if (token0Symbol.toLowerCase() == "ausd") {
//             token0Symbol = "KUSD"
//         }
//         if (token1Symbol.toLowerCase() == "ausd") {
//             token1Symbol = "KUSD"   
//         }

//         const token0 = bncAssets.find((asset: any) => {
//             return asset.tokenData.symbol == token0Symbol
//         })
//         const token1 = bncAssets.find((asset: any) => {
//             return asset.tokenData.symbol == token1Symbol
//         })
//         console.log(token0Symbol)
//         console.log(token0)
//         console.log(token1Symbol)
//         console.log(token1)
//         const newLp: MyLp = {
//             chainId: 2001,
//             dexType: "V2",
//             poolAssets: [token0?.tokenData.localId, token1?.tokenData.localId],
//             liquidityStats: [reserve0, reserve1]
//         }
//         // console.log(newLp)
//         return newLp
//     })
//     console.log("---------------------")
//     console.log(lps)
//     fs.writeFileSync('../../lps/bnc/lps.json', JSON.stringify(lps, null, 2));
// }

async function getLps(): Promise<MyLp[]> {
    return JSON.parse(fs.readFileSync('../hko/lps.json', 'utf8'));
}

async function queryAssets(): Promise<TokenData[]> {
    const provider = new WsProvider('wss://bifrost-parachain.api.onfinality.io/public-ws');
    const api = await ApiPromise.create({ provider: provider });
    await api.isReady;
    const parachainId = await (await api.query.parachainInfo.parachainId()).toJSON() as number;
    const bncAssets = await api.query.assetRegistry.currencyMetadatas.entries();
    const assets = bncAssets.map(([key, value]) => {
        const localId = (key.toHuman() as any)[0];
        const metaData = value.toHuman() as any;
        let localString = (key.toHuman() as any)[0];

        //Remove "," from values in VSBond array
        for (const [key, value] of Object.entries(localString)) {
            if (key === "VSBond" && Array.isArray(value)) {
                localString[key] = value.map((item: any) => {
                    return item.replace(/,/g, "")
                })
            }
        }
        const asset: TokenData = {
            network: "kusama",
            chain: parachainId,
            localId: localString,
            name: metaData.name,
            symbol: metaData.symbol,
            decimals: metaData.decimals,
            minimalBalance: metaData.minimalBalance.toString().replace(/,/g, "")
        }
        return asset

    })
    console.log(assets)
    return assets;
}

async function main() {
    // await saveLps()
    await updateLps(false)
    // await queryAssets()
    // await getLps()
    process.exit(0)
}

// main()