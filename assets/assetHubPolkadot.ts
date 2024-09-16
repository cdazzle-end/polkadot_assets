
import * as fs from 'fs';
import path from 'path';
import { MyJunction, TokenData, IMyAsset, MyMultiLocation } from '../types.ts';
import { getNativeAsset, getStableAsset } from './acaNativeAssets.ts';
import { Keyring, ApiPromise, WsProvider } from '@polkadot/api';
// import {WsProvider } from '@polkadot/rpc-provider'
import { options } from '@acala-network/api'
import { getApiForNode, PNode } from '../utils.ts';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function queryAssets(chopsticks: boolean): Promise<IMyAsset[]> {
    // let chopsticks = false
    let api = await getApiForNode("AssetHubPolkadot", chopsticks)
    const allAssets = await api.query.assets.metadata.entries();
    // console.log(allAssets);

    let assetHubRegistry = allAssets.map((asset) => {
        let assetId = asset[0].toHuman() as any
        assetId = assetId[0].replace(/,/g, "")
        let assetData = asset[1].toHuman() as any
        let assetSymbol = assetData.symbol
        let assetDecimals = assetData.decimals
        let assetName = assetData.name

        let assetObject: TokenData = {
            network: "polkadot",
            chain: 1000,
            localId: assetId,
            symbol: assetSymbol,
            decimals: assetDecimals,
            name: assetName
        }

        let assetLocation = {
            "X3": [
              {
                "Parachain": "1000"
              },
              {
                "PalletInstance": "50"
              },
              {
                "GeneralIndex": assetId
              }
            ]
          }

        let assetRegistryObject: IMyAsset = {
            tokenData: assetObject,
            hasLocation: true,
            tokenLocation: assetLocation
        }

        // console.log(JSON.stringify(assetRegistryObject, null, 2))
        return assetRegistryObject


    })

    // fs.writeFileSync("asset_registry/asset_hub_polkadot_assets.json", JSON.stringify(assetHubRegistry, null, 2))
    return assetHubRegistry


}

export async function updateRegistryAssetHub(chopsticks: boolean){
    let queriedAssets = await queryAssets(chopsticks) as any
    let assetRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, "asset_registry/asset_hub_polkadot_assets.json"), "utf-8")) as any
    console.log("assets in registry: ", assetRegistry.length)

    // Create a map of existing asset IDs for quick lookup
    const existingIds = new Set(assetRegistry.map(asset => asset.tokenData.localId));

    // Filter out assets that already exist in the registry
    const newAssets = queriedAssets.filter(asset => !existingIds.has(asset.tokenData.localId));

    // Append new assets to the registry
    assetRegistry.push(...newAssets);
    console.log("assets in registry after update: ", assetRegistry.length)

    fs.writeFileSync(path.join(__dirname, "asset_registry/asset_hub_polkadot_assets.json"), JSON.stringify(assetRegistry, null, 2))

}



async function main(){
    // await queryAssets()
    await updateRegistryAssetHub(false)
    // process.exit(0)
}

// main()