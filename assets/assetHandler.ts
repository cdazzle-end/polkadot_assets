import * as fs from 'fs';
import path from 'path';
import { MyJunction, MyAsset, MyAssetRegistryObject, MyMultiLocation, Relay } from '../types.ts';
import { getNativeAsset, getStableAsset } from './acaNativeAssets.ts';
import { Keyring, ApiPromise, WsProvider } from '@polkadot/api';
// import {WsProvider } from '@polkadot/rpc-provider'
import { options } from '@acala-network/api'
import { getApiForNode } from '../utils.ts';
import { fileURLToPath } from 'url';
import { updateRegistryAssetHub as updateAssetRegistryAssetHub } from './assetHubPolkadot.ts';
import { updateAssetRegistryHydra } from './hydra.ts';
import { saveCollectedAssetRegistry } from './collectAssets.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// async function updatePolkadotAssetRegistry(chopsticks: boolean){
//     await updateAssetRegistryAssetHub(chopsticks)
//     await updateAssetRegistryHydra(chopsticks)
//     await saveCollectedAssetRegistry()
// }

async function updateAssetRegistry(chopsticks: boolean, relay: Relay){
    if(relay === "polkadot") {
        // Update AssetHub and HyrdraDX, as these are the only ones that change often. Could change to update others if needed
        await updateAssetRegistryAssetHub(chopsticks)
        await updateAssetRegistryHydra(chopsticks)
    } else {
        // Functions to update kusama asset's here...

    }
    await saveCollectedAssetRegistry(relay)
}

async function main(){
    let args = process.argv
    let relay: Relay = args[2] as Relay
    if (relay !== 'polkadot' && relay !== 'kusama') {
        throw new Error(`Argument for relay incorrect: ${relay} | Must be 'kusama' or 'polkadot'`)
    }

    let chopsticks = args[3]; // Keep as string
    if (chopsticks !== 'true' && chopsticks !== 'false') {
        throw new Error(`Argument for chopsticks not correct: ${chopsticks}. Must be true or false.`);
    }
    let runWithChopsticks: boolean = (chopsticks === 'true'); // Convert to boolean

    console.log(JSON.stringify(args))
    console.log("relay: " + relay)
    console.log("chopsticks: " + runWithChopsticks)

    updateAssetRegistry(runWithChopsticks, relay)
    process.exit(0)
}

main()