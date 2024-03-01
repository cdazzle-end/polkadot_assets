import * as fs from 'fs';
import path from 'path';
import { MyLp, MyJunction, MyAsset, MyAssetRegistryObject, MyMultiLocation } from '../types';
// import { MyLp } from '../lp_types';
const axios = require('axios').default;
import { WsProvider, Keyring, ApiPromise } from '@polkadot/api';
import { ModuleBApi, BifrostConfig } from '@zenlink-dex/sdk-api';
import { Percent, Token, TokenAmount, TradeType, StandardPair, StandardPool, StablePair, StableSwap,  AssetMeta } from '@zenlink-dex/sdk-core';
import { firstValueFrom } from 'rxjs';

const localRpc = "ws://172.26.130.75:8009"

let BifrostPolkadotConfig = BifrostConfig;
BifrostPolkadotConfig.networkId = 300
BifrostPolkadotConfig.wss = ["wss://bifrost-polkadot.api.onfinality.io/public-ws"]
BifrostPolkadotConfig.chainId= 2030
const liveRpc = BifrostPolkadotConfig.wss[0]

export async function updateLps(chopsticks: boolean) {
    let rpc = chopsticks ? localRpc : liveRpc
    const provider = new WsProvider(rpc);
    await provider.isReady;
    const dexApi = new ModuleBApi(
        provider,
        BifrostPolkadotConfig
    );
    await dexApi.initApi();
    const response = await axios.get('https://raw.githubusercontent.com/zenlinkpro/token-list/main/tokens/bifrost-polkadot.json');
    const tokensMeta = response.data.tokens;

    const zenTokens = tokensMeta.map((item: AssetMeta) => {
        return new Token(item);
    });
    const bncAssets = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/asset_registry/bnc_polkadot_assets.json'), 'utf8'))

    const standardPairs = await firstValueFrom(dexApi.standardPairOfTokens(zenTokens));
    const standardPools = await firstValueFrom(dexApi.standardPoolOfPairs(standardPairs));
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
            poolAssets: [token0?.tokenData.localId, token1?.tokenData.localId],
            liquidityStats: [pool.reserve0.numerator.toString(), pool.reserve1.numerator.toString()]
        }
        return newLp
    })
    // console.log(JSON.stringify(lps, null, 2))
    await fs.writeFileSync(path.join(__dirname, './lp_registry/bnc_lps.json'), JSON.stringify(lps, null, 2));
    dexApi.api?.disconnect();
}

export async function saveLps() {
    // const provider = new WsProvider('wss://heiko-rpc.parallel.fi');
    // const api = new ApiPromise(options({ provider }));
    // await api.isReady;

    console.log(JSON.stringify(BifrostPolkadotConfig, null, 2))
    const provider = new WsProvider(BifrostPolkadotConfig.wss[0]);
    await provider.isReady;
    const dexApi = new ModuleBApi(
        provider,
        BifrostPolkadotConfig
    );
    await dexApi.initApi(); // init the api;
    const response = await axios.get('https://raw.githubusercontent.com/zenlinkpro/token-list/main/tokens/bifrost-polkadot.json');
    const tokensMeta = response.data.tokens;
    // console.log(tokensMeta)

    const zenTokens = tokensMeta.map((item: AssetMeta) => {
        return new Token(item);
    });
    const filePath = path.join(__dirname, './../assets/asset_registry/bnc_polkadot_assets.json');
    // fs.writeFileSync(filePath, JSON.stringify(assetRegistry, null, 2))
    const bncAssets = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    // console.log(zenTokens.name + " " + zenTokens.symbol)
    zenTokens.forEach((token: any) => {
        console.log(token.name + " " + token.symbol)
    })
    console.log("---------------------")
    const standardPairs = await firstValueFrom(dexApi.standardPairOfTokens(zenTokens));
    const standardPools = await firstValueFrom(dexApi.standardPoolOfPairs(standardPairs));
    const lps = standardPools.map((pool: any) => {
        console.log("--")
        console.log(pool.tokenAmounts[0].token.name + " " + pool.tokenAmounts[0].token.symbol)
        console.log(pool.tokenAmounts[1].token.name + " " + pool.tokenAmounts[1].token.symbol)
        let token0Symbol = pool.tokenAmounts[0].token.symbol
        let token1Symbol = pool.tokenAmounts[1].token.symbol
        let reserve0 = pool.reserve0.numerator.toString()
        let reserve1 = pool.reserve1.numerator.toString()
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
        console.log(token0Symbol)
        console.log(token0)
        console.log(token1Symbol)
        console.log(token1)
        const newLp: MyLp = {
            chainId: 2030,
            poolAssets: [token0?.tokenData.localId, token1?.tokenData.localId],
            liquidityStats: [reserve0, reserve1]
        }
        // console.log(newLp)
        return newLp
    })
    console.log("---------------------")
    console.log(lps)
    fs.writeFileSync(path.join(__dirname, './lp_registry/bnc_polkadot_lps.json'), JSON.stringify(lps, null, 2));
}

async function getLps(): Promise<MyLp[]> {
    return JSON.parse(fs.readFileSync('../hko/lps.json', 'utf8'));
}

async function queryAssets(): Promise<MyAsset[]> {
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
        const asset: MyAsset = {
            network: "polkadot",
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
    await saveLps()
    // await queryAssets()
    // await getLps()
    process.exit(0)
}

// main()