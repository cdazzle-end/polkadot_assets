
import * as fs from 'fs';
import path from 'path';
import { MyJunction, MyAsset, MyAssetRegistryObject, MyMultiLocation, Relay } from '../types.ts';
import { getNativeAsset, getStableAsset } from './acaNativeAssets.ts';
import { Keyring, ApiPromise, WsProvider } from '@polkadot/api';
// import {WsProvider } from '@polkadot/rpc-provider'
import { options } from '@acala-network/api'
import { getApiForNode } from '../utils.ts';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define a new type for the entries in the arrays
type AssetEntry = {
    asset: MyAssetRegistryObject;
    sourceList: "Here" | "Executor" | "Files"; // 1 for assetRegistryHere, 2 for assetRegistryExecutor
};

const polkadotAssetFiles = [
    "aca_assets.json",
    "bnc_polkadot_assets.json",
    "glmr_assets.json",
    "glmr_evm_assets.json",
    "hdx_assets.json",
    "other_polkadot_assets.json",
    "para_assets.json",
    "asset_hub_polkadot_assets.json"
]

const kusamaAssetFiles = [
    "bnc_kusama_assets.json",
    "bsx_assets.json",
    "hko_assets.json",
    "kar_assets.json",
    "mgx_assets.json",
    "movr_assets.json",
    "other_kusama_assets.json",
    "asset_hub_kusama_assets.json"

]


async function compareAssetRegistry(){
    let assetRegistryHere: MyAssetRegistryObject[] = JSON.parse(fs.readFileSync("asset_registry/allAssetsPolkadot.json", "utf-8"))
    let assetRegistryExecutor: MyAssetRegistryObject[] = JSON.parse(fs.readFileSync("asset_registry/allAssetsPolkadotMain.json", "utf-8"))
    let assetRegistryFromFiles: MyAssetRegistryObject[] = await buildPolkadotAssetsFromFiles();

    let commonAssets: AssetEntry[] = [];
    let uniqueAssets: AssetEntry[] = [];

    let assetList: MyAssetRegistryObject[] = []

    assetRegistryExecutor.forEach((assetHere) => {
        let assetFound = assetRegistryFromFiles.find((assetFromFile) => {
            let assetFile = assetFromFile.tokenData as MyAsset;
            let assetHereData = assetHere.tokenData as MyAsset;
            return JSON.stringify(assetFile.localId) === JSON.stringify(assetHereData.localId);
        });
        if (!assetFound) {
            assetList.push(assetHere);
        }
    })

    console.log(JSON.stringify(assetList, null, 2))

    console.log(`Number of missing assets: ${assetList.length}`)
}

export async function saveCollectedAssetRegistry(relay: Relay){
    if (relay === 'polkadot'){
        console.log(`Saving POLKADOT assets`)
        let assetRegistryCollected = await buildPolkadotAssetsFromFiles();
        fs.writeFileSync("asset_registry/allAssetsPolkadotCollected.json", JSON.stringify(assetRegistryCollected, null, 2))    
    } else {
        console.log(`Saving OTHER assets`)
        let assetRegistryCollected = await buildKusamaAssetsFromFiles();
        fs.writeFileSync("asset_registry/allAssetsKusamaCollected.json", JSON.stringify(assetRegistryCollected, null, 2))    
    }
}

async function buildPolkadotAssetsFromFiles(){
    let assetRegistryFolder = path.join(__dirname, "/asset_registry/");
    let assetRegistryCollected = [];
    polkadotAssetFiles.forEach((file) => {
        let assetRegistryFile: MyAssetRegistryObject[] = JSON.parse(fs.readFileSync(assetRegistryFolder + file, "utf-8"));
        assetRegistryCollected = assetRegistryCollected.concat(assetRegistryFile);
    })

    return assetRegistryCollected;
}
async function buildKusamaAssetsFromFiles(){
    let assetRegistryFolder = path.join(__dirname, "/asset_registry/");
    let assetRegistryCollected = [];
    kusamaAssetFiles.forEach((file) => {
        let assetRegistryFile: MyAssetRegistryObject[] = JSON.parse(fs.readFileSync(assetRegistryFolder + file, "utf-8"));
        assetRegistryCollected = assetRegistryCollected.concat(assetRegistryFile);
    })

    return assetRegistryCollected;
}

export function deepEqual(obj1: any, obj2: any) {
    // console.log("***** DEEP EQUAL *****")
    // console.log("obj1: " + JSON.stringify(obj1))
    // console.log("obj2: " + JSON.stringify(obj2))
    if (obj1 === obj2) {
        return true;
    }
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) {
        return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (let key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}
async function run(){
    // await compareAssetRegistry()
    await saveCollectedAssetRegistry('kusama')
    // await buildAssetsFromFiles()
}

// run()