import { TNode, getAllNodeProviders } from '@paraspell/sdk'
import { ApiPromise, WsProvider } from '@polkadot/api'; // Type-only import
import {  } from '@polkadot/api';    // Value import


import {Mangata } from "@mangata-finance/sdk"
import { dotRpc, ksmRpc, localRpcs } from './consts.ts';
import { BifrostConfig, ModuleBApi } from '@zenlink-dex/sdk-api'
import { ApiMap, PNode, Relay } from './types.ts'
import { databaseDirectory, assetRegistryFolder, lpRegistryFolder } from './consts.ts'
import fs from 'fs'

let apiMap: ApiMap;

export async function setApiMap(map: ApiMap) {
    apiMap = map;
}
function isBncDex(api: ApiPromise | ModuleBApi): api is ModuleBApi {
    return (api as ModuleBApi).api !== undefined;
}
/**
 * Using this to get/set dex API for bifrost, so we dont have to change return type of main function
 * 
 * Main function will also get and set dex api, but return ApiPromise
 * 
 * This will return the actual entry in the apiMap for bifrost, which is a ModuleBApi
 * 
 * @returns 
 */
export async function getBifrostDexApi(relay: Relay, chopsticks: boolean): Promise<ModuleBApi>{
    let map = apiMap;

    let node: TNode = relay === "polkadot" ? "BifrostPolkadot" : "BifrostKusama";

    let endpoint = chopsticks ? localRpcs[node] : getAllNodeProviders(node);

    let dexApi: ModuleBApi;

    if(map.has(node)){
        console.log(`Returning dex api for BifrostPolkadot`);
        let mapQuery = map.get(node);
        dexApi = mapQuery as ModuleBApi;
    } else {
        let provider = new WsProvider(endpoint);
        let bncApi = new ModuleBApi(provider, BifrostConfig);
        await provider.isReady;
        await bncApi.initApi();
        map.set(node, bncApi);
        dexApi = bncApi;
    };
    return dexApi;
}

export async function getApiForNode(node: PNode, chopsticks: boolean): Promise<ApiPromise> {

    if (apiMap.has(node)) {
        console.log("Returning existing api for node: ", node);
        return apiMap.get(node) as ApiPromise;
    }
    let apiEndpoint: string[];

    if(node == "Kusama"){
        apiEndpoint = [ksmRpc]
    } else if (node == "Polkadot"){ 
        apiEndpoint = [dotRpc]
    } else{
        apiEndpoint = getAllNodeProviders(node)
    }

    if(chopsticks){
        let localRpc = localRpcs[node]
        if(localRpc){
            apiEndpoint = [localRpc]
        }
    }
    
    console.log(`Initialize api for ${node} | ${apiEndpoint[0]} `)
    let api: ApiPromise | undefined;
    let apiConnected = false;
    
    if(node == "Mangata"){
        try{
            const MangataSDK = await import('@mangata-finance/sdk')
            api = await MangataSDK.Mangata.instance([apiEndpoint[0]]).api()
            await api.isReady
            if(api.isConnected) {
                // console.log("API is connected: TRUE")
            } else {
                console.log("EDGE CASE | INVESTIGATE: API is connected: FALSE")
                await api.connect()
                console.log("API now connected")
            }
            apiConnected = true;
            
        } catch(e){
            console.log(`Error connecting mangata api ${apiEndpoint[0]}, trying next endpoint`)
            const MangataSDK = await import('@mangata-finance/sdk')
            api = await MangataSDK.Mangata.instance([apiEndpoint[1]]).api()
            await api.isReady
            if(api.isConnected) {
                console.log("API is connected: TRUE")
            } else {
                console.log("API is connected: FALSE")
                await api.connect()
                console.log("API now connected")
            }
            apiConnected = true;
        }
    } else if (node === "BifrostPolkadot") {
        const provider = new WsProvider(apiEndpoint);
        const dexApi = new ModuleBApi(
          provider,
          BifrostConfig
        );
        await provider.isReady;
        await dexApi.initApi(); // init the api;
        if(!dexApi.api){
            throw new Error("BNC Polkadot dexApi.api is undefined")
          }
          apiConnected = true;
          api = dexApi.api as unknown as ApiPromise
    } else {
        let endpointIndex = 0;
        if(node == "Moonbeam" && !chopsticks){
            endpointIndex = 1 // Currently the working endpoint for moonbeam
        }
        while(endpointIndex < apiEndpoint.length && !apiConnected){
            try{
                let provider = new WsProvider(apiEndpoint[endpointIndex])
                api = await ApiPromise.create({ provider: provider });
                
                await api.isReady
                if(api.isConnected) {
                } else {
                    await api.connect()
                }
                apiConnected = true;
                // return api
            } catch (e) {
                console.log(`Error connecting api ${apiEndpoint[endpointIndex]}, trying next endpoint`)  
            }
            endpointIndex++
        }
    }

    if(!apiConnected || !api){
        throw new Error("Could not connect to api")
    }
    apiMap.set(node, api)

    return api
    
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

export function createDatabaseDirectory(){
    if (!fs.existsSync(databaseDirectory)){
        fs.mkdirSync(databaseDirectory);
    }
}

export function confirmAssetRegistryDirectory(){
    createDatabaseDirectory()
    if (!fs.existsSync(assetRegistryFolder)){
        fs.mkdirSync(assetRegistryFolder);
    }
}

export function confirmLpRegistryDirectory(){
    createDatabaseDirectory()
    if (!fs.existsSync(lpRegistryFolder)){
        fs.mkdirSync(lpRegistryFolder);
    }
}