import path from 'path';
import { ApiMap, Relay } from '../types.ts';
import { fileURLToPath } from 'url';
import { updateAssetRegistryAssetHub as updateAssetRegistryAssetHub } from './assetHubPolkadot.ts';
import { saveCollectedAssetRegistry } from './collectAssets.ts';
import { updateAssetRegistryHydra } from './hydra.ts';
import { setApiMap } from '../utils.ts';
import { ApiPromise } from '@polkadot/api';
import { ModuleBApi } from '@zenlink-dex/sdk-api';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



async function updateAssetRegistry(chopsticks: boolean, relay: Relay){


    if(relay === "polkadot") {
        console.log(`Updating POLKADOT assets`)
        // Update AssetHub and HyrdraDX, as these are the only ones that change often. Could change to update others if needed
        await updateAssetRegistryAssetHub(chopsticks)
        await updateAssetRegistryHydra(chopsticks)
    } else {
        console.log(`Updating OTHER assets`)
        // Functions to update kusama asset's here...

    }
    await saveCollectedAssetRegistry(relay)
}

export async function updateAssetRegistryWithMap(chopsticks: boolean, relay: Relay, apiMap?: ApiMap){
    if(apiMap){
        setApiMap(apiMap)
    }
    if(relay === "polkadot") {
        console.log(`Updating POLKADOT assets`)
        // Update AssetHub and HyrdraDX, as these are the only ones that change often. Could change to update others if needed
        await updateAssetRegistryAssetHub(chopsticks)
        await updateAssetRegistryHydra(chopsticks)
    } else {
        console.log(`Updating OTHER assets`)
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

    // await updateAssetRegistry(runWithChopsticks, relay)
    await updateAssetRegistryWithMap(runWithChopsticks, relay)
    // process.exit(0)
}

// main()