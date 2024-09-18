import * as fs from 'fs';
import { MyLp, MyJunction, TokenData, IMyAsset, MyMultiLocation } from '../../types.ts';
// import {} from '../types';
// import { Keyring, ApiPromise, WsProvider, } from '@polkadot/api';
// import { options } from '@parallel-finance/api';
// import { CurrencyId, Pool, Balance } from '@parallel-finance/types/interfaces';
import { ApiPromise, WsProvider } from '@polkadot/api';
// import { WsProvider } from '@polkadot/rpc-provider';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { getApiForNode } from '../../utils.ts';

const localRpc = "ws://172.26.130.75:8012"
const liveRpc = 'wss://heiko-rpc.parallel.fi'

export async function updateLps(chopsticks: boolean) {
    // let api = await getApiForNode("ParallelHeiko", chopsticks);
    // await api.isReady;
    const provider = new WsProvider(liveRpc);
    const api = new ApiPromise({ provider });
    await api.isReady;

    const parachainId = await (await api.query.parachainInfo.parachainId()).toJSON() as number;
    const lpEntries = await api.query.amm.pools.entries();
    let assets: TokenData[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/asset_registry/hko_assets.json'), 'utf8')).map((asset: any) => {
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
            dexType: "solar",
            poolAssets: [baseAsset?.localId, quoteAsset?.localId],
            liquidityStats: [baseAmount, quoteAmount]
        }
        return newLp
    })
    //If a pool asset is not found in the asset registry, remove it from the lps array
    lps = lps.filter((lp) => {
        return lp.poolAssets[0] != undefined || lp.poolAssets[1] != undefined
    })
    fs.writeFileSync(path.join(__dirname, './lp_registry/hko_lps.json'), JSON.stringify(lps, null, 2))
    // api.disconnect()
}

async function saveLps(chopsticks: boolean) {
    let api = await getApiForNode("ParallelHeiko", chopsticks);
    await api.isReady;

    const parachainId = await (await api.query.parachainInfo.parachainId()).toJSON() as number;
    const lpEntries = await api.query.amm.pools.entries();
    

    let assets: TokenData[] = JSON.parse(fs.readFileSync('../../assets/hko/asset_registry.json', 'utf8')).map((asset: any) => {
        return asset.tokenData
    })
    let lps = lpEntries.map(([assetData, lpData]) => {
        const poolAssetIdData = assetData.args
        


        const lp = lpData.toJSON()
        // const pool: Pool = api.createType('Pool', lp)
        const pool = lp as any
        const [baseAmount, quoteAmount] = [pool.baseAmount.toString(), pool.quoteAmount.toString()]
        const poolAssetIds = [(poolAssetIdData[0].toHuman() as any).replace(/,/g, ""), (poolAssetIdData[1].toHuman() as any).replace(/,/g, "")]
        const [baseAsset, quoteAsset] = poolAssetIds.map((poolAssetId: any) => {
            const matchedAsset = assets.find((asset: any) => {
                return asset.localId == poolAssetId
            })
            return matchedAsset
        })
        const newLp: MyLp = {
            chainId: parachainId,
            dexType: "solar",
            poolAssets: [baseAsset?.localId, quoteAsset?.localId],
            liquidityStats: [baseAmount, quoteAmount]
        }
        return newLp
    })
    //If a pool asset is not found in the asset registry, remove it from the lps array
    lps = lps.filter((lp) => {
        return lp.poolAssets[0] != undefined || lp.poolAssets[1] != undefined
    })
    fs.writeFileSync(path.join(__dirname, './lp_registry/hko_lps.json'), JSON.stringify(lps, null, 2))
}

async function getLps(): Promise<MyLp[]> {
    return JSON.parse(fs.readFileSync('../hko/lps.json', 'utf8'));
}

async function main() {
    // await saveLps()
    // await getLps()
    process.exit(0)
}

// main()