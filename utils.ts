import { TNode, getAllNodeProviders } from '@paraspell/sdk'
import { ApiPromise, WsProvider } from '@polkadot/api'
export const ksmRpc = "wss://kusama-rpc.dwellir.com"
export const dotRpc = "wss://polkadot-rpc.dwellir.com"
import {Mangata } from "@mangata-finance/sdk"
import { localRpcs } from './consts.ts';

export type PNode = TNode | 'Polkadot' | 'Kusama' 
let apiMap: Map<PNode, ApiPromise> = new Map<PNode, ApiPromise>();

export async function setApiMap(map: Map<PNode, ApiPromise>) {
    apiMap = map;
}

export async function getApiForNode(node: PNode, chopsticks: boolean): Promise<ApiPromise> {

    if (apiMap.has(node)) {
        console.log("Returning existing api for node: ", node);
        return apiMap.get(node) as ApiPromise;
    }

    console.log("Getting api for node : ", node, "Chopsticks: ", chopsticks)
    let apiEndpoint: string[];

    if(node == "Kusama"){
        apiEndpoint = [ksmRpc]
    } else if (node == "Polkadot"){ 
        apiEndpoint = [dotRpc]
    } else{
        apiEndpoint = getAllNodeProviders(node)
    }

    console.log("Getting local RPC")
    if(chopsticks){
        let localRpc = localRpcs[node]
        if(localRpc){
            apiEndpoint = [localRpc]
        }
    }
    
    console.log("Node RPC: ", apiEndpoint[0])
    let api: ApiPromise;
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
    } else {
        let endpointIndex = 0;
        if(node == "Moonbeam" && !chopsticks){
            endpointIndex = 1 // Currently the working endpoint for moonbeam
        }
        while(endpointIndex < apiEndpoint.length && !apiConnected){
            console.log("Connecting to api: ", apiEndpoint[endpointIndex])
            try{
                let provider = new WsProvider(apiEndpoint[endpointIndex])
                api = await ApiPromise.create({ provider: provider });
                
                await api.isReady
                console.log("API is ready: TRUE")
                if(api.isConnected) {
                    console.log("API is connected: TRUE")
                } else {
                    console.log("API is connected: FALSE")
                    await api.connect()
                    console.log("API now connected")
                }
                apiConnected = true;
                // return api
            } catch (e) {
                console.log(`Error connecting api ${apiEndpoint[endpointIndex]}, trying next endpoint`)  
            }
            endpointIndex++
        }
    }

    console.log("NODE: ", node, "API CONNECTED: ", apiConnected)
    if(!apiConnected){
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