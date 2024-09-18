import * as lpHandler from './lps/index.ts';
import { updateAssetRegistryAssetHub, saveCollectedAssetRegistry, updateAssetRegistryHydra } from './assets/index.ts';
import path from 'path';
import { ApiMap, Relay } from './types.ts';
import { fileURLToPath } from 'url';
import { setApiMap } from './utils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



export async function updateAssetRegistry(chopsticks: boolean, relay: Relay){


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

export async function updateLpsWithMap(chopsticks: boolean, relay: string, apiMap?: ApiMap) {
    if(apiMap){
        setApiMap(apiMap)
    }
    console.log(`Updating ${relay} Lps`)
    if (relay === "polkadot") {
        await updatePolkadotLps(chopsticks)
    } else if (relay === "kusama") {
        await updateKusamaLps(chopsticks)
    } else {
        console.log("Invalid relay")
        process.exit(0)
    }

}

async function updatePolkadotLps(chopsticks: boolean) {
    await Promise.all([
        lpHandler.bncPolkadotHandler.updateLps(chopsticks).then(() => console.log("bnc polkadot complete")),
        lpHandler.paraHandler.updateLps(chopsticks).then(() => console.log("para complete")),
        lpHandler.acaHandler.updateLps(chopsticks).then(() => console.log("aca complete")),
        lpHandler.hdxHandler.updateLps(chopsticks).then(() => console.log("hdx complete")),
        lpHandler.glmrHandler.saveLps().then(() => console.log("glmr complete"))
    ]);
}

async function updateKusamaLps(chopsticks: boolean) {
    await Promise.all([
        lpHandler.bncKusamaHandler.updateLps(chopsticks).then(() => console.log("bnc kusama complete")),
        lpHandler.hkoHandler.updateLps(chopsticks).then(() => console.log("hko complete")),
        lpHandler.karHandler.updateLps(chopsticks).then(() => console.log("kar complete")),
        // lpHandler.kucoinHandler.updateLps().then(() => console.log("kucoin complete")),
        lpHandler.mgxHandler.updateLps(chopsticks).then(() => console.log("mgx complete")),
        lpHandler.bsxHandler.updateLps(chopsticks).then(() => console.log("bsx complete")),
        lpHandler.movrHandler.updateLps().then(() => console.log("movr complete")),
        // lpHandler.sdnHandler.updateLps().then(() => console.log("sdn complete"))
    ]);
}
