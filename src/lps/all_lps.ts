import * as fs from 'fs';
// import { MyJunction, MyAsset, MyAssetRegistryObject, MyMultiLocation } from '../assets/asset_types';
import { ApiMap, MyLp } from '../types.ts';
import * as bncPolkadotHandler from './bifrost_polkadot.ts'
import * as paraHandler from './parallel.ts'
import * as acaHandler from './acala.ts'
import * as glmrHandler from './moonbeam.ts'
import * as bncKusamaHandler from './bifrost_kusama.ts'
import * as hkoHandler from './heiko.ts'
import * as karHandler from './karura.ts'
import * as movrHandler from './moonriver.ts'
import * as bsxHandler from './basilisk.ts'
// import * as sdnHandler from './sdn/lp_handler'

// import * as sdnHandler from './sdn/lp_handler'
// import * as kucoinHandler from './kucoin/lp_handler'
import * as mgxHandler from './mangata.ts'
import * as hdxHandler from './hydra.ts'
import { ApiPromise } from '@polkadot/api';
import { setApiMap } from '../utils.ts';

const dateTimeOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'America/New_York',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
};

// const options: Intl.DateTimeFormatOptions = {
//     timeZone: 'America/New_York',
//     hour12: false,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit"
// };

// const formatter = new Intl.DateTimeFormat('en-US', options);
// const estTime = formatter.format(date);


// export async function updateLpsChop() {
//     await Promise.all([
//         bncHandler.updateLps().then(() => console.log("bnc complete")),
//         hkoHandler.updateLps().then(() => console.log("hko complete")),
//         karHandler.updateLps().then(() => console.log("kar complete")),
//         // kucoinHandler.updateLps().then(() => console.log("kucoin complete")),
//         mgxHandler.updateLps().then(() => console.log("mgx complete")),
//         bsxHandler.updateLps().then(() => console.log("bsx complete")),
//         movrHandler.updateLps().then(() => console.log("movr complete")),
//         sdnHandler.updateLps().then(() => console.log("sdn complete"))
//     ]);
// }


async function startTimer() {
    console.log("startTimer")
    const date = new Date();
    const startTime = date.toLocaleString('en-US', dateTimeOptions);
    fs.appendFileSync("lp_timestamps.txt", "LPs started at: " + startTime + "\n");
}
async function updateLpTimeStamp() {

    console.log("updateLpTimeStamp")
    const date = new Date();
    const startTime = date.toLocaleString('en-US', dateTimeOptions);
    fs.appendFileSync("lp_timestamps.txt", "LPs updated at: " + startTime + "\n");
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
        bncPolkadotHandler.updateLps(chopsticks).then(() => console.log("bnc polkadot complete")),
        paraHandler.updateLps(chopsticks).then(() => console.log("para complete")),
        acaHandler.updateLps(chopsticks).then(() => console.log("aca complete")),
        hdxHandler.updateLps(chopsticks).then(() => console.log("hdx complete")),
        glmrHandler.saveLps().then(() => console.log("glmr complete"))
    ]);
}

async function updateKusamaLps(chopsticks: boolean) {
    await Promise.all([
        bncKusamaHandler.updateLps(chopsticks).then(() => console.log("bnc kusama complete")),
        hkoHandler.updateLps(chopsticks).then(() => console.log("hko complete")),
        karHandler.updateLps(chopsticks).then(() => console.log("kar complete")),
        // kucoinHandler.updateLps().then(() => console.log("kucoin complete")),
        mgxHandler.updateLps(chopsticks).then(() => console.log("mgx complete")),
        bsxHandler.updateLps(chopsticks).then(() => console.log("bsx complete")),
        movrHandler.updateLps().then(() => console.log("movr complete")),
        // sdnHandler.updateLps().then(() => console.log("sdn complete"))
    ]);
}

async function testGlmr(){
    await glmrHandler.saveLps()
    console.log("Updated moonbeam")
}

// RUN with args RELAY, CHOPSTICKS. ts-node all_lps.ts polkadot true
async function main() {

    // let chopsticks = await process.argv.includes("true")
    let args = process.argv
    let relay = args[2]
    let chopsticks = args[3]
    console.log(JSON.stringify(args))
    console.log("relay: " + relay)
    console.log("chopsticks: " + chopsticks)
    let runWithChopsticks
    if (chopsticks === "true") {
        runWithChopsticks = true
    } else {
        runWithChopsticks = false
    }
    if(relay === "polkadot") {
        await updatePolkadotLps(runWithChopsticks)
    } else if(relay === "kusama") {
        await updateKusamaLps(runWithChopsticks)
    } else {
        console.log("Invalid relay")
        process.exit(0)
    }

    // startTimer()
    // await updateKusamaLps(false)
    // updateLpTimeStamp()
    process.exit(0)
}

// main()
// testGlmr()
// updateLpsWithMap(true, "polkadot")