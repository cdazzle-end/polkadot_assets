import path from 'path';
import { Relay } from '../types.ts';
import { fileURLToPath } from 'url';
import { updateRegistryAssetHub as updateAssetRegistryAssetHub } from './assetHubPolkadot.ts';
import { saveCollectedAssetRegistry } from './collectAssets.ts';
import { updateAssetRegistryHydra } from './hydra.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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