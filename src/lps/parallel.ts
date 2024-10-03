import * as fs from 'fs';
import * as path from 'path';
import { MyJunction, TokenData, IMyAsset, MyMultiLocation } from '../types.ts';
import {MyLp} from '../types.ts';
// import { Keyring, ApiPromise, WsProvider, } from '@polkadot/api';
// import { options } from '@parallel-finance/api';
// import { CurrencyId, Pool, Balance } from '@parallel-finance/types/interfaces';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { getApiForNode } from '../utils.ts';

import { fileURLToPath } from 'url';
import { paraAssetRegistry, paraLpRegistry } from '../consts.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// import { localRpcs } from 'consts.ts';

// const localRpc = localRpcs["Parallel"]
const liveRpc = 'wss://parallel-rpc.dwellir.com'

export async function updateLps(chopsticks: boolean) {
    let api = await getApiForNode("Parallel", chopsticks);
    await api.isReady;
    
    const parachainId = await (await api.query.parachainInfo.parachainId()).toJSON() as number;
    const lpEntries = await api.query.amm.pools.entries();
    let assets: TokenData[] = JSON.parse(fs.readFileSync(paraAssetRegistry, 'utf8')).map((asset: any) => {
        return asset.tokenData
    })
    let lps = lpEntries.map(([assetData, lpData]) => {
        const poolAssetIdData = assetData.args
        const lp = lpData.toHuman()
        let pool = lp as any
        // const pool: Pool = api.createType('Pool', lp)
        const [baseAmount, quoteAmount] = [pool.baseAmount.toString().replace(/,/g, ""), pool.quoteAmount.toString().replace(/,/g, "")]
        const poolAssetIds = [(poolAssetIdData[0].toHuman() as any).replace(/,/g, ""), (poolAssetIdData[1].toHuman() as any).replace(/,/g, "")]
        const [baseAsset, quoteAsset] = poolAssetIds.map((poolAssetId: any) => {
            const matchedAsset = assets.find((asset: any) => {
                return asset.localId == poolAssetId
            })
            return matchedAsset
        })
        const newLp: MyLp = {
            chainId: parachainId,
            dexType: "V2",
            poolAssets: [baseAsset?.localId, quoteAsset?.localId],
            liquidityStats: [baseAmount, quoteAmount]
        }
        return newLp
    })
    //If a pool asset is not found in the asset registry, remove it from the lps array
    lps = lps.filter((lp) => {
        return lp.poolAssets[0] != undefined || lp.poolAssets[1] != undefined
    })
    fs.writeFileSync(path.join(paraLpRegistry), JSON.stringify(lps, null, 2))
    // api.disconnect()
}

async function saveLps() {
    const provider = new WsProvider(liveRpc);
    const api = new ApiPromise({ provider });
    await api.isReady;

    const parachainId = await (await api.query.parachainInfo.parachainId()).toJSON() as number;
    const lpEntries = await api.query.amm.pools.entries();
    
    // console.log(JSON.stringify(lpEntries, null, 2))

    let assets: TokenData[] = JSON.parse(fs.readFileSync(path.join(paraAssetRegistry), 'utf8')).map((asset: any) => {
        return asset.tokenData
    })
    let lps = lpEntries.map(([assetData, lpData]) => {
        const poolAssetIdData = assetData.args
        // console.log(poolAssetIdData[0].toHuman())
        // console.log(poolAssetIdData[1].toHuman())
        // console.log(lpData.toJSON())


        const lp = lpData.toHuman()
        // console.log(lp)
        // const pool: Pool = api.createType('Pool', lp)
        let pool = lp as any
        const [baseAmount, quoteAmount] = [pool.baseAmount.replace(/,/g, ""), pool.quoteAmount.replace(/,/g, "")]
        // console.log(baseAmount)
        // console.log(quoteAmount)
        const poolAssetIds = [(poolAssetIdData[0].toHuman() as any).replace(/,/g, ""), (poolAssetIdData[1].toHuman() as any).replace(/,/g, "")]
        const [baseAsset, quoteAsset] = poolAssetIds.map((poolAssetId: any) => {
            const matchedAsset = assets.find((asset: any) => {
                return asset.localId == poolAssetId
            })
            return matchedAsset
        })
        const newLp: MyLp = {
            chainId: parachainId,
            dexType: "V2",
            poolAssets: [baseAsset?.localId, quoteAsset?.localId],
            liquidityStats: [baseAmount, quoteAmount]
        }
        return newLp
    })
    //If a pool asset is not found in the asset registry, remove it from the lps array
    lps = lps.filter((lp) => {
        return lp.poolAssets[0] != undefined || lp.poolAssets[1] != undefined
    })
    fs.writeFileSync(path.join(paraLpRegistry), JSON.stringify(lps, null, 2))
}


async function main() {
    // await saveLps()
    // await getLps()
    process.exit(0)
}

// main()