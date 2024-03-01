import * as paraspell from '@paraspell/sdk'
import { ApiPromise, WsProvider } from '@polkadot/api'
export const ksmRpc = "wss://kusama-rpc.dwellir.com"
import {Mangata } from "@mangata-finance/sdk"
export async function getApiForNode(node: paraspell.TNode | "Kusama", chopsticks: boolean){
    let apiEndpoint: string[];

    if(node == "Kusama"){
        apiEndpoint = [ksmRpc]
    } else{
        apiEndpoint = paraspell.getAllNodeProviders(node)
    }

    console.log("Node RPC: ", apiEndpoint[0])
    let api: ApiPromise;
    let apiConnected = false;
    
    if(node == "Mangata"){
        console.log("Connecting to Mangata API")
        try{
            let mgxEndpoint = "wss://kusama-rpc.mangata.online"
            // const MangataSDK = await import('@mangata-finance/sdk')
            // api = await MangataSDK.Mangata.instance([apiEndpoint[0]]).api()
            // api = await MangataSDK.Mangata.instance([mgxEndpoint]).api()
            let api = await Mangata.getInstance([apiEndpoint[0]]).getApi()
            // api = await Mangata.instance([apiEndpoint[0]]).api()
            await api.isReady
            if(api.isConnected) {
                console.log("API is connected: TRUE")
            } else {
                console.log("API is connected: FALSE")
                await api.connect()
                console.log("API now connected")
            }
            apiConnected = true;
            // return api
        } catch(e){
            console.log(`Error connecting mangata api ${apiEndpoint[0]}, trying next endpoint`)
            // const MangataSDK = await import('@mangata-finance/sdk')
            // api = await MangataSDK.Mangata.instance([apiEndpoint[1]]).api()
            api = await Mangata.getInstance([apiEndpoint[0]]).getApi()
            await api.isReady
            if(api.isConnected) {
                console.log("API is connected: TRUE")
            } else {
                console.log("API is connected: FALSE")
                await api.connect()
                console.log("API now connected")
            }
            apiConnected = true;
            // return api
        }
    } else {
        let endpointIndex = 1;
        
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
    return api
    
}