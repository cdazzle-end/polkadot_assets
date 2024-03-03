import * as fs from 'fs';
import * as path from 'path';
import { MyJunction, MyAsset, MyAssetRegistryObject, MyMultiLocation } from '../types';
import {MyLp} from '../types';
// import { Keyring, ApiPromise, WsProvider, } from '@polkadot/api';
// import { options } from '@parallel-finance/api';
// import { CurrencyId, Pool, Balance } from '@parallel-finance/types/interfaces';
import { ApiPromise, WsProvider } from '@polkadot/api';
// import { WsProvider } from '@polkadot/rpc-provider';
// import { BigNumber } from 'ethers';
import {BN} from '@polkadot/util';
import { getApiForNode } from './../utils.ts';

const localRpc = "ws://172.26.130.75:8012"
const liveRpc = 'wss://parallel-rpc.dwellir.com'

export async function updateLps(chopsticks: boolean) {
    // let api = await getApiForNode("Parallel", chopsticks);
    let rpc = chopsticks ? localRpc : liveRpc

    const provider = new WsProvider(rpc);
    const api = new ApiPromise({ provider });
    await api.isReady;
    // await api.isReady;

    const parachainId = await (await api.query.parachainInfo.parachainId()).toJSON() as number;
    const lpEntries = await api.query.amm.pools.entries();
    let assets: MyAsset[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/asset_registry/para_assets.json'), 'utf8')).map((asset: any) => {
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
            poolAssets: [baseAsset?.localId, quoteAsset?.localId],
            liquidityStats: [baseAmount, quoteAmount]
        }
        return newLp
    })
    //If a pool asset is not found in the asset registry, remove it from the lps array
    lps = lps.filter((lp) => {
        return lp.poolAssets[0] != undefined || lp.poolAssets[1] != undefined
    })
    fs.writeFileSync(path.join(__dirname, './lp_registry/para_lps.json'), JSON.stringify(lps, null, 2))
    api.disconnect()
}

async function saveLps() {
    const provider = new WsProvider(liveRpc);
    const api = new ApiPromise({ provider });
    await api.isReady;

    const parachainId = await (await api.query.parachainInfo.parachainId()).toJSON() as number;
    const lpEntries = await api.query.amm.pools.entries();
    
    // console.log(JSON.stringify(lpEntries, null, 2))

    let assets: MyAsset[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/asset_registry/para_assets.json'), 'utf8')).map((asset: any) => {
        return asset.tokenData
    })
    let lps = lpEntries.map(([assetData, lpData]) => {
        const poolAssetIdData = assetData.args
        // console.log(poolAssetIdData[0].toHuman())
        // console.log(poolAssetIdData[1].toHuman())
        // console.log(lpData.toJSON())


        const lp = lpData.toHuman()
        console.log(lp)
        // const pool: Pool = api.createType('Pool', lp)
        let pool = lp as any
        const [baseAmount, quoteAmount] = [pool.baseAmount.replace(/,/g, ""), pool.quoteAmount.replace(/,/g, "")]
        console.log(baseAmount)
        console.log(quoteAmount)
        const poolAssetIds = [(poolAssetIdData[0].toHuman() as any).replace(/,/g, ""), (poolAssetIdData[1].toHuman() as any).replace(/,/g, "")]
        const [baseAsset, quoteAsset] = poolAssetIds.map((poolAssetId: any) => {
            const matchedAsset = assets.find((asset: any) => {
                return asset.localId == poolAssetId
            })
            return matchedAsset
        })
        const newLp: MyLp = {
            chainId: parachainId,
            poolAssets: [baseAsset?.localId, quoteAsset?.localId],
            liquidityStats: [baseAmount, quoteAmount]
        }
        return newLp
    })
    //If a pool asset is not found in the asset registry, remove it from the lps array
    lps = lps.filter((lp) => {
        return lp.poolAssets[0] != undefined || lp.poolAssets[1] != undefined
    })
    fs.writeFileSync(path.join('./lp_registry/para_lps.json'), JSON.stringify(lps, null, 2))
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