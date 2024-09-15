import { ApiPromise, WsProvider } from '@polkadot/api';
import * as fs from 'fs';
import path from 'path';
import { IMyAsset, MyJunction, MyMultiLocation, TokenData } from '../types.ts';
import { BifrostConfig, ModuleBApi } from '@zenlink-dex/sdk-api';
// import pkg from '@zenlink-dex/sdk-api';
// const { ModuleBApi, BifrostConfig } = pkg;  
import { Token } from '@zenlink-dex/sdk-core';
// import sdkCore from '@zenlink-dex/sdk-core';
// const { Percent, Token, TokenAmount, TradeType, StandardPair, StandardPool, StablePair, StableSwap, AssetType } = sdkCore
import axios from 'axios';
import { fileURLToPath } from 'url';
import { getApiForNode } from '../utils.ts';
import { bncPolkadotAssetRegistry } from '../consts.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function saveAssets() {
    // const provider = new WsProvider('wss://bifrost-parachain.api.onfinality.io/public-ws');
    // const api = await ApiPromise.create({ provider: provider });
    let api = await getApiForNode("BifrostPolkadot", false);
    await api.isReady;
    const parachainId = await (await api.query.parachainInfo.parachainId()).toJSON() as number;
    const bncAssets: TokenData[] = await queryAssets(api);
    bncAssets.forEach((asset) => {
        console.log(asset)
    });
    const bncAssetLocations = await queryLocations(api);

    //Match assets with their locations
    const assetRegistry = await Promise.all(bncAssets.map(async (asset: TokenData) => {
        let [assetIdKey, assetIdValue] = Object.entries(asset.localId)[0];

        const assetLocation = bncAssetLocations.find((location) => {
            let [locationIdKey, locationIdValue] = Object.entries(location[1])[0];
            if (locationIdKey.toLocaleLowerCase() == assetIdKey.toLocaleLowerCase() && locationIdValue == assetIdValue) {
                return true
            }
        }) 
        let assetRegistryObject:IMyAsset = assetLocation ? {
            tokenData: asset,
            hasLocation: true,
            tokenLocation: assetLocation[0]
        } : {
            tokenData: asset,
            hasLocation: false,
        }

        console.log(assetRegistryObject)
        return assetRegistryObject
    }))
    const zenAssets = await queryZenAssets();
    zenAssets.forEach((zenAsset: any) => {

    })
    assetRegistry.forEach((asset) => {
        let data = asset.tokenData as TokenData;
        console.log(data.localId)
        console.log(asset.hasLocation)
        if(asset.hasLocation){
            console.log(asset.tokenLocation)
        }
    })
    fs.writeFileSync(bncPolkadotAssetRegistry, JSON.stringify(assetRegistry, null, 2));


}

async function queryZenAssets() {
    const provider = new WsProvider(BifrostConfig.wss[0]);
    await provider.isReady;
    const dexApi = new ModuleBApi(
        provider,
        BifrostConfig
    );
    await dexApi.initApi(); // init the api;
    const response = await axios.get('https://raw.githubusercontent.com/zenlinkpro/token-list/main/tokens/bifrost-polkadot.json');
    const tokensMeta = response.data.tokens;
    const zenTokens = tokensMeta.map((item) => {
        return new Token(item);
    });
    const zenAssets = zenTokens.map((token: any) => {
        const tokenId = {
            Zenlink: {
                assetType: token.assetType,
                assetIndex: token.assetIndex,
            }
        }
        let tokenSymbol = token.symbol as string
        if (tokenSymbol.toLowerCase() == "ausd") {
            // console.log(token)
            const newAsset: TokenData = {
                network: "polkadot",
                chain: 2030,
                localId: tokenId,
                name: "KUSD",
                symbol: "KUSD",
                decimals: token.decimals
            }
            return newAsset
        } else {
            const newAsset: TokenData = {
                network: "polkadot",
                chain: 2030,
                localId: tokenId,
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals
            }
            return newAsset
        }
    })
    // console.log(zenAssets)
    return zenAssets
}
async function queryLocations(api: ApiPromise) {
    // const provider = new WsProvider('wss://bifrost-parachain.api.onfinality.io/public-ws');
    // const api = await ApiPromise.create({ provider: provider });
    await api.isReady;
    // let opt: ApiOptions = {
    //     provider: provider
    // }
    // const api = new ApiPromise(opt);
    await api.isReady;

    const locationEntries = await api.query.assetRegistry.locationToCurrencyIds.entries();
    const assetLocations = locationEntries.map(([location, id]) => {
        const currencyId = id.toJSON() as string;
        let locationData = (location.toHuman() as any)[0];
        const junction = Object.keys(locationData.interior)[0]
        if (locationData.interior == "Here") {
            console.log("FOUND HERE")
            let newLocation = "here"
            return [newLocation, currencyId]
        } else if (junction == "X1") {
            const junctionData = locationData.interior[junction];
            const junctionType = Object.keys(junctionData)[0]
            let junctionValue = junctionData[junctionType]
            let newLocation: MyMultiLocation;
            let newJunction: MyJunction = {};

            if (junctionType == "GeneralKey") {
                // let keys = Object.keys(junctions[x])[0]
                // let val = junctions[x][keys]
                const paraJunction = { Parachain: "2030" }
                newJunction = {
                    GeneralKey: {
                        length: junctionValue.length,
                        data: junctionValue.data
                    }
                };
                let junctionList: MyJunction[] = []
                let jList = [paraJunction, newJunction]
                newLocation = {
                    X2: jList
                }
                
            } else {
                junctionValue = junctionValue.toString().replace(/,/g, "")
                
                newJunction[junctionType] = junctionValue;
                // junctionList.push(newJunction)
                // return newJunction
                newLocation = {
                    [junction]: newJunction
                }
            }
            
            // let formattedLocation = api.createType('Junctions', newLocation).toJSON()
            return [newLocation, currencyId]
        } else {
            const junctions = locationData.interior[junction];
            let junctionList: MyJunction[] = [];

            for (const x in junctions) {
                let junctionType = Object.keys(junctions[x])[0]
                let junctionValue = junctions[x][junctionType]

                if (junctionType == "GeneralKey") {
                    let keys = Object.keys(junctions[x])[0]
                    let val = junctions[x][keys]
                    let newJunction: MyJunction = {
                        GeneralKey: {
                            length: val.length,
                            data: val.data
                        }
                    };
                    console.log
                    console.log(newJunction)
                    junctionList.push(newJunction)
                } else {
                    junctionValue = junctionValue.toString().replace(/,/g, "")
                    let newJunction: MyJunction = {};
                    newJunction[junctionType] = junctionValue;
                    junctionList.push(newJunction)
                }
            }

            let newLocation: MyMultiLocation = {
                [junction]: junctionList
            }
            let formattedLocation = api.createType('Junctions', newLocation).toJSON()
            return [newLocation, currencyId]
        }
    })
    //Can't retrieve a MultiLocation from api.createType, so we will use MyMultilocation to represent a properly formatted MultiLocation
    let formattedAssetLocations = assetLocations.map(([location, currencyId]) => {
        return [location, currencyId as any]
    })
    return formattedAssetLocations

}

async function queryAssets(api: ApiPromise): Promise<TokenData[]> {
    // const provider = new WsProvider('wss://bifrost-parachain.api.onfinality.io/public-ws');
    // const api = await ApiPromise.create({ provider: provider });
    await api.isReady;
    const parachainId = await (await api.query.parachainInfo.parachainId()).toJSON() as number;
    const bncAssets = await api.query.assetRegistry.currencyMetadatas.entries();
    const assets = bncAssets.map(([key, value]) => {
        const localId = (key.toHuman() as any)[0];
        const metaData = value.toHuman() as any;
        let localString = (key.toHuman() as any)[0];
        
        //Remove "," from values in VSBond array
        for (const [key, value] of Object.entries(localString)) {
            if (key === "VSBond" && Array.isArray(value)) {
                localString[key] = value.map((item: any) => {
                    return item.replace(/,/g, "")
                })
            }
        }
        const asset: TokenData = {
            network: "polkadot",
            chain: parachainId,
            localId: localString,
            name: metaData.name,
            symbol: metaData.symbol,
            decimals: metaData.decimals as string,
            minimalBalance: metaData.minimalBalance.toString().replace(/,/g, "")
        }
        return asset
        
    })
    return assets;
}


// async function getColorLocation(assetIdKey: any, assetIdValue: any) {
//     const colorAssets = JSON.parse(fs.readFileSync(`../bnc/kusama_2001_assets.json`, 'utf8'));
//     const match = await colorAssets.find((colorAsset: any) => {
//         let [colorKey, colorValue] = Object.entries(colorAsset.asset)[0];
//         if (colorKey == assetIdKey && colorValue == assetIdValue) {
//             return true
//         }
//     })
//     let colorLocation = await JSON.parse(match.xcmInteriorKey)
//     // console.log(location)
//     let xtype = "x" + (colorLocation.length - 1).toString()
//     let locationInterior = {
//         // parents: 1,
//         [xtype]: colorLocation.slice(1)
//     }
//     return locationInterior
// }

export async function getAssets(): Promise<IMyAsset[]> {
    return JSON.parse(fs.readFileSync(`../assets/bnc/asset_registry.json`, 'utf8'));
}

async function main() {
    // queryAssets();
    // queryLocations();
    // await saveAssets();
    // await queryZenAssets()
    // process.exit(0)
}

// main()