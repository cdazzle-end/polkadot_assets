import * as fs from 'fs';
import path from 'path';
import { MyJunction, TokenData, IMyAsset, MyMultiLocation } from '../types.ts';
import { getNativeAsset, getStableAsset } from './acaNativeAssets.ts';
import { Keyring, ApiPromise, WsProvider } from '@polkadot/api';
// import {WsProvider } from '@polkadot/rpc-provider'
import { options } from '@acala-network/api'
import { getApiForNode } from '../utils.ts';
import { fileURLToPath } from 'url';
import { acaAssetRegistry } from '../consts.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//This can be converted to unified MyAsset type
interface KaruraAsset {
    network: "polkadot";
    chain: number,
    localId: string,
    name: string,
    symbol: string,
    decimals: string,
    minimalBalance: string,
}

class MyKaruraAsset implements KaruraAsset {
    // network: "polkadot";
    chain = 2000
    constructor(
        public network: "polkadot",
        public localId: string,
        public name: string,
        public symbol: string,
        public decimals: string,
        public minimalBalance: string,
    ) { }
}

// General Key hex string as arg
function convertToNewGeneralKey(oldKey: any) {
    // Ensure the oldKey starts with '0x'
    // if (!oldKey.startsWith('0x')) {
    //     throw new Error('Invalid old GeneralKey format');
    // }
    if (typeof oldKey !== 'string') {
        // throw new Error(`Expected oldKey to be a string, but got ${typeof oldKey}`);
        return oldKey
    }

    // Remove '0x' prefix and calculate the length
    const keyWithoutPrefix = oldKey.slice(2);
    const length = keyWithoutPrefix.length / 2;

    // Right-pad the key with zeros to 64 characters (32 bytes)
    const paddedData = keyWithoutPrefix.padEnd(64, '0');

    return {
        length: JSON.stringify(length),
        data: '0x' + paddedData
    };
}

export async function saveAssets() {

    // const provider = new WsProvider('wss://karura.api.onfinality.io/public-ws');
    // const api = new ApiPromise(options({ provider }));
    let api = await getApiForNode("Acala", false)
    await api.isReady;

    //Asset metadata and asset locations
    const assetData: KaruraAsset[] = await queryAssets(api);
    const assetLocations = await queryLocations(api);

    //Combine metadata and location to create Asset Registry objects
    let assetRegistry = await Promise.all(assetData.map(async (asset: KaruraAsset) => {
        if (Object.keys(asset.localId)[0] == "ForeignAssetId") {
            const assetLocation = await assetLocations.find((location) => {
                if (Object.values(asset.localId)[0] as any === Object.values(location[1].toHuman() as any)[0] as any) {
                    return true;
                }
            });
            // Check if assetLocation is defined
            if (!assetLocation) {
                console.log("UNDEFINED")
            } else {
                const junction = Object.keys(assetLocation[0] as any)[0]
                

                if (junction == "X1") {
                    const junctionData = (assetLocation[0] as any)[junction]
                    const junctionType = Object.keys(junctionData)[0]
                    const junctionValue = junctionData[junctionType]
                    const newJunction: MyJunction = {}
                    let newLocation: MyMultiLocation = {}
                    if (junctionType == "GeneralKey") {
                        //Convert General Key
                        const newGeneralKeyJunctionValue = convertToNewGeneralKey(junctionValue)
                        newJunction[junctionType] = newGeneralKeyJunctionValue;
                        newLocation = {
                            X1: newJunction
                        }
                    } else {
                        newJunction[junctionType] = junctionValue;
                        newLocation = {
                            X1: newJunction
                        }
                    }
                    const newAssetRegistryObject: IMyAsset = {
                        tokenData: asset as TokenData,
                        hasLocation: true,
                        tokenLocation: newLocation
                    }
                    return newAssetRegistryObject
                } else {
                    const junctions = (assetLocation[0] as any)[junction]
                    let junctionList: MyJunction[] = [];
                    for (const x in junctions) {
                        const junctionType = Object.keys(junctions[x])[0]
                        const junctionValue = junctions[x][junctionType]
                        let newJunction: MyJunction = {}

                        if (junctionType == "GeneralKey") {
                            //Convert General Key 
                            const newGeneralKeyJunctionValue = convertToNewGeneralKey(junctionValue)
                            newJunction[junctionType] = newGeneralKeyJunctionValue;
                        } else {
                            newJunction[junctionType] = junctionValue;
                        }
                        junctionList.push(newJunction)

                    }

                    const newLocation: MyMultiLocation = {
                        [junction]: junctionList
                    }
                    let newAssetRegistryObject: IMyAsset = {
                        tokenData: asset,
                        hasLocation: true,
                        tokenLocation: newLocation
                    }
                    // console.log(newAssetRegistryObject.tokenLocation)
                    return newAssetRegistryObject
                }
            }
        }
        else if (Object.keys(asset.localId)[0] == "NativeAssetId") {
            console.log("GET NATUVE ASSET")
            const assetId = Object.values(Object.values(asset.localId)[0])[0]
            const locationData = await getNativeAsset(assetId);
            console.log(JSON.stringify(assetId))
            console.log(JSON.stringify(locationData))
            if (locationData == "here") {
                const newAssetRegistryObject: IMyAsset = {
                    tokenData: asset as TokenData,
                    hasLocation: true,
                    tokenLocation: locationData
                }
                return newAssetRegistryObject
            }

            console.log(JSON.stringify(locationData))
            const junction = Object.keys(locationData.interior)[0]
            if (junction == "X1") {
                const junctionData = locationData.interior[junction]
                const junctionType = Object.keys(junctionData)[0]
                const junctionValue = junctionData[junctionType]

                const newJunction: MyJunction = {}
                let newLocation: MyMultiLocation = {}
                if (junctionType == "GeneralKey") {
                    //Convert General Key
                    const newGeneralKeyJunctionValue = convertToNewGeneralKey(junctionValue)
                    newJunction[junctionType] = newGeneralKeyJunctionValue;
                    newLocation = {
                        X1: newJunction
                    }  
                } else {
                    newJunction[junctionType] = junctionValue;
                    newLocation = {
                        X1: newJunction
                    }
                }
                const newAssetRegistryObject: IMyAsset = {
                    tokenData: asset as TokenData,
                    hasLocation: true,
                    tokenLocation: newLocation
                }
                return newAssetRegistryObject
            } else {
                const junctions = locationData.interior[junction]
                let junctionList: MyJunction[] = [];
                for (const x in junctions) {
                    const junctionType = Object.keys(junctions[x])[0]
                    const junctionValue = junctions[x][junctionType]
                    let newJunction: MyJunction = {}

                    if (junctionType == "GeneralKey") {
                        //Convert General Key
                        const newGeneralKeyJunctionValue = convertToNewGeneralKey(junctionValue)
                        newJunction[junctionType] = newGeneralKeyJunctionValue;
                    } else {
                        newJunction[junctionType] = junctionValue;
                    }
                    junctionList.push(newJunction)

                }

                const newLocation: MyMultiLocation = {
                    [junction]: junctionList
                }
                let newAssetRegistryObject: IMyAsset = {
                    tokenData: asset,
                    hasLocation: true,
                    tokenLocation: newLocation
                }
                return newAssetRegistryObject
            }
            
        } else if (Object.keys(asset.localId)[0] == "StableAssetId") {
            const assetId = Object.values(Object.values(asset.localId)[0])[0]
            const locationData = await getStableAsset(assetId);
            if (locationData == "here") {
                const newAssetRegistryObject: IMyAsset = {
                    tokenData: asset as TokenData,
                    hasLocation: true,
                    tokenLocation: locationData
                }
                return newAssetRegistryObject
            }
            const junction = Object.keys(locationData.interior)[0]
            if (junction == "X1") {
                const junctionData = locationData.interior[junction]
                const junctionType = Object.keys(junctionData)[0]
                const junctionValue = junctionData[junctionType]

                const newJunction: MyJunction = {}
                let newLocation: MyMultiLocation = {}
                if (junctionType == "GeneralKey") {
                    //Convert General Key
                    const newGeneralKeyJunctionValue = convertToNewGeneralKey(junctionValue)
                    newJunction[junctionType] = newGeneralKeyJunctionValue;
                    newLocation = {
                        X1: newJunction
                    }
                } else {
                    newJunction[junctionType] = junctionValue;
                    newLocation = {
                        X1: newJunction
                    }
                }
                const newAssetRegistryObject: IMyAsset = {
                    tokenData: asset as TokenData,
                    hasLocation: true,
                    tokenLocation: newLocation
                }
                return newAssetRegistryObject
            } else {
                const junctions = locationData.interior[junction]
                let junctionList: MyJunction[] = [];
                for (const x in junctions) {
                    const junctionType = Object.keys(junctions[x])[0]
                    const junctionValue = junctions[x][junctionType]
                    let newJunction: MyJunction = {}

                    if (junctionType == "GeneralKey") {
                        //Convert General Key
                        const newGeneralKeyJunctionValue = convertToNewGeneralKey(junctionValue)
                        newJunction[junctionType] = newGeneralKeyJunctionValue;
                    } else {
                        newJunction[junctionType] = junctionValue;
                    }
                    junctionList.push(newJunction)

                }

                const newLocation: MyMultiLocation = {
                    [junction]: junctionList
                }
                let newAssetRegistryObject: IMyAsset = {
                    tokenData: asset,
                    hasLocation: true,
                    tokenLocation: newLocation
                }
                return newAssetRegistryObject
            }
        } else if (Object.keys(asset.localId)[0] == "Erc20") {
            const newAssetRegistryObject: IMyAsset = {
                tokenData: asset as TokenData,
                hasLocation: false,
            }
            return newAssetRegistryObject
        }

    }));
    assetRegistry.forEach((asset) => {
        console.log(asset?.tokenData.name)
        console.log(JSON.stringify(asset?.tokenLocation))
    })

    fs.writeFileSync(acaAssetRegistry, JSON.stringify(assetRegistry, null, 2));
}

// export async function getAssets(): Promise<MyAssetRegistryObject[]> {
//     return JSON.parse(fs.readFileSync('../assets/kar/asset_registry.json', 'utf8'));
// }

//api is funky with asset id's, convert asset id's to currency id's


async function queryAssets(api: ApiPromise): Promise<KaruraAsset[]> {
    await api.isReady;
    const assetRegistry = await api.query.assetRegistry.assetMetadatas.entries();
    const assets = assetRegistry.map(([key, value]) => {
        let localId = (key.toHuman() as any)[0];
        const metaData = value.toHuman() as any;
        console.log(metaData)
        const asset: KaruraAsset = new MyKaruraAsset("polkadot", localId, metaData.name, metaData.symbol, metaData.decimals, metaData.minimalBalance.toString().replace(/,/g, ""));
        return asset
    })
    return assets;
}
function updateValueByKey(obj: any, targetKey: any): any {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    for (let key in obj) {
        if (key === targetKey && typeof obj[key] === 'string') {
            // Remove commas if the value is a string
            obj[key] = JSON.stringify(obj[key]).replace(/,/g, '');
        } else {
            // Recursively check and update nested objects
            obj[key] = updateValueByKey(obj[key], targetKey);
        }
    }

    return obj;
}
function removeCommasFromAllValues(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            // Remove commas if the value is a string
            obj[key] = obj[key].replace(/,/g, '');
        } else {
            // Recursively remove commas from nested objects
            obj[key] = removeCommasFromAllValues(obj[key]);
        }
    }

    return obj;
}
async function queryLocations(api: any) {
    let locationEntries = await api.query.assetRegistry.locationToCurrencyIds.entries();
    let locations = locationEntries.map(([location, id]: any) => {
        // const currencyId = (id.toHuman() as any)[0].replace(/,/g, "");
        const currencyId = id;
        let locationData = (location.toHuman() as any)[0];
        locationData = removeCommasFromAllValues(locationData)
        console.log(locationData.interior)
        const junction = Object.keys(locationData.interior)[0]
        let junctionList: MyJunction[] = [];

        if (locationData.interior == "Here") {
            const newLocation = "here"
            return [newLocation, currencyId]
        } else {
            const junctionData = locationData.interior[junction];

            if (!Array.isArray(junctionData)) { // If junction is X1
                let newLocation: MyMultiLocation;
                let newJunction: MyJunction = junctionData;
                newLocation = {
                    [junction]: newJunction
                }
                return [newLocation, currencyId]

            } else {
                const junctions = locationData.interior[junction];
                junctions.forEach((junction: any) => {
                    const newJunction: MyJunction = junction;
                    junctionList.push(newJunction)
                })
                let newLocation: MyMultiLocation = {
                    [junction]: junctionList
                }
                return [newLocation, currencyId]
            }
        }

    })
    locations.forEach(([location, id]: any) => {
        console.log(id.toHuman())
        console.log(JSON.stringify(location))
    })
    return locations;

}

//Karura js API only retrieves ForeignAssets
// async function queryAssetLocations(api: ApiPromise): Promise<[MultiLocation, CurrencyId][]> {
//     await api.isReady;
  
//     const locationEntries = await api.query.assetRegistry.locationToCurrencyIds.entries();
//     const assetLocations: any = locationEntries.map(([location, currencyId]) => {
//         console.log("Finding LOCATION")
//         console.log(currencyId.toHuman())
        
//         let locationData = (location.toHuman() as any)[0];
//         console.log(locationData)
//         const junction = Object.keys(locationData.interior)[0]
//         if (junction == "X1") {
//             const junctionData = locationData.interior[junction];
//             const junctionType = Object.keys(junctionData)[0]
//             let junctionValue = junctionData[junctionType]
//             // junctionValue = junctionValue.toString().replace(/,/g, "")
//             let newJunction: MyJunction = {};
//             if (junctionType == "GeneralKey") {
//                 //Convert General Key
//                 const newGeneralKeyJunctionValue = convertToNewGeneralKey(junctionValue)
//                 newJunction[junctionType] = newGeneralKeyJunctionValue;
//             } else {
//                 newJunction[junctionType] = junctionValue;
//             }
//             let newLocation: MyMultiLocation = {
//                 X1: newJunction
//             }
//             // let formattedLocation = api.createType('Junctions', newLocation).toJSON()
//             console.log(newLocation)
//             return [newLocation, currencyId]
//         } else if (junction == "Here") {
//             let newLocation = "here"
//             console.log(newLocation)
//             return [newLocation, currencyId]
//         } else {
//             const junctions = locationData.interior[junction];
//             let junctionList: MyJunction[] = [];
//             for (const x in junctions) {
//                 let junctionType = Object.keys(junctions[x])[0]
//                 let junctionValue = junctions[x][junctionType]
//                 // console.log(junctionValue)
//                 // junctionValue = junctionValue.toString().replace(/,/g, "")
//                 let newJunction: MyJunction = {};
//                 if (junctionType == "GeneralKey") {
//                     //Convert General Key
//                     console.log(junctionValue)
//                     const newGeneralKeyJunctionValue = convertToNewGeneralKey(junctionValue)
//                     newJunction[junctionType] = newGeneralKeyJunctionValue;
//                 } else {
//                     newJunction[junctionType] = junctionValue;
//                 }
//                 newJunction[junctionType] = junctionValue;
//                 junctionList.push(newJunction)
//             }

//             let newLocation: MyMultiLocation = {
//                 [junction]: junctionList
//             }

//             console.log(newLocation)
//             // let formattedLocation = api.createType('Junctions', newLocation).toJSON()
//             return [newLocation, currencyId]
//         }
//     })

//     //Make sure that location and currencyId are correct
//     // const multiLocations: [MultiLocation, CurrencyId][] = assetLocations.map(([location, currencyId]: [MyMultiLocation, Codec]) => {
//     //     const multiLocation: MultiLocation = api.createType('Junctions', location)
//     //     let karCurrencyId = api.createType('CurrencyId', currencyId.toHex())
//     //     return [multiLocation, karCurrencyId]
//     // })
//     return assetLocations;
// }
async function queryAssetsAndLocations(api: ApiPromise){
    //Asset metadata and asset locations
    const assetData: KaruraAsset[] = await queryAssets(api);
    // const assetLocations: [MultiLocation , CurrencyId][] = await queryLocations(api);
    
    const assetLocations = await queryLocations(api);
    // console.log(assetData)
    // console.log(assetLocations)

    // assetLocations.forEach(([location, id]: any) => {
    //     console.log(JSON.stringify(id.toHuman()))
    //     console.log(JSON.stringify(location))
    // })

    assetData.forEach((asset: KaruraAsset) => {
        console.log(JSON.stringify(asset.localId))
        assetLocations.find(([location, id]: any) => {
            if(JSON.stringify(asset.localId) === JSON.stringify(id.toHuman())){
                console.log("Found location for ID: ", asset.localId)
                console.log(JSON.stringify(location))
                return true
            }
        })
    })
     //Combine metadata and location to create Asset Registry objects
//     let assetRegistry = await Promise.all(assetData.map(async (asset: KaruraAsset) => {
//         if (Object.keys(asset.localId)[0] == "ForeignAssetId") {
//             const assetLocation = await assetLocations.find((location) => {
//                 if (Object.values(asset.localId)[0] as any === Object.values(location[1].toHuman() as any)[0] as any) {
//                     return true;
//                 }
//             });
//             // Check if assetLocation is defined
//             if (!assetLocation) {
//                 console.log("UNDEFINED")
//             } else {
//                 const junction = Object.keys(assetLocation[0] as any)[0]
                

//                 if (junction == "X1") {
//                     const junctionData = (assetLocation[0] as any)[junction]
//                     const junctionType = Object.keys(junctionData)[0]
//                     const junctionValue = junctionData[junctionType]
//                     const newJunction: MyJunction = {}
//                     let newLocation: MyMultiLocation = {}
//                     if (junctionType == "GeneralKey") {
//                         //Convert General Key
//                         const newGeneralKeyJunctionValue = convertToNewGeneralKey(junctionValue)
//                         newJunction[junctionType] = newGeneralKeyJunctionValue;
//                         newLocation = {
//                             X1: newJunction
//                         }
//                     } else {
//                         newJunction[junctionType] = junctionValue;
//                         newLocation = {
//                             X1: newJunction
//                         }
//                     }
//                     const newAssetRegistryObject: MyAssetRegistryObject = {
//                         tokenData: asset as MyAsset,
//                         hasLocation: true,
//                         tokenLocation: newLocation
//                     }
//                     return newAssetRegistryObject
//                 } else {
//                     const junctions = (assetLocation[0] as any)[junction]
//                     let junctionList: MyJunction[] = [];
//                     for (const x in junctions) {
//                         const junctionType = Object.keys(junctions[x])[0]
//                         const junctionValue = junctions[x][junctionType]
//                         let newJunction: MyJunction = {}

//                         if (junctionType == "GeneralKey") {
//                             //Convert General Key 
//                             const newGeneralKeyJunctionValue = convertToNewGeneralKey(junctionValue)
//                             newJunction[junctionType] = newGeneralKeyJunctionValue;
//                         } else {
//                             newJunction[junctionType] = junctionValue;
//                         }
//                         junctionList.push(newJunction)

//                     }

//                     const newLocation: MyMultiLocation = {
//                         [junction]: junctionList
//                     }
//                     let newAssetRegistryObject: MyAssetRegistryObject = {
//                         tokenData: asset,
//                         hasLocation: true,
//                         tokenLocation: newLocation
//                     }
//                     // console.log(newAssetRegistryObject.tokenLocation)
//                     return newAssetRegistryObject
//                 }
//             }
//         }
}
type AssetType = 'Erc20' | 'Token' | 'LiquidCrowdloan' | 'StableAssetPoolToken' | 'ForeignAsset';
async function testLocalIdTypes(){
    const filePath = path.join(__dirname, './asset_registry/aca_assets.json')
    const acalaAssets: IMyAsset[] = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    acalaAssets.forEach((asset) => {
        const tokenData = asset.tokenData as TokenData
        const id = tokenData.localId
        console.log(`ID: ${JSON.stringify(id)}`)

        const [assetType, assetId] = determineAssetType(tokenData.localId)
        // console.log(`Determined Asset Type: ${assetType} | ${assetId}`)

        const formattedAssetParameter = {
            [assetType]: assetId
        }
        console.log(`${JSON.stringify(formattedAssetParameter)}`)
        console.log('--------------------------------')
    })
}
function determineAssetType(localId: any): [AssetType, string] {
//   const { localId } = tokenData;

//     if ('Erc20' in localId) {
//         return ['Erc20', localId.Erc20!];
//     }

//   if ('NativeAssetId' in localId) {
//     if (localId.NativeAssetId && 'Token' in localId.NativeAssetId) {
//       return ['Token', localId.NativeAssetId.Token!];
//     }
//     if (localId.NativeAssetId && 'LiquidCrowdloan' in localId.NativeAssetId) {
//       return ['LiquidCrowdloan', localId.NativeAssetId.LiquidCrowdloan!];
//     }
//   }

//   if ('StableAssetId' in localId) {
//     return ['StableAssetPoolToken', localId.StableAssetId!];
//   }

//   if ('ForeignAssetId' in localId) {
//     return ['ForeignAsset', localId.ForeignAssetId!];
//   }

//   throw new Error('Unknown asset type');
if ('NativeAssetId' in localId) {
    if (localId.NativeAssetId !== undefined && 'Token' in localId.NativeAssetId) return ['Token', localId.NativeAssetId.Token];
    if (localId.NativeAssetId !== undefined && 'LiquidCrowdloan' in localId.NativeAssetId) return ['LiquidCrowdloan', localId.NativeAssetId.LiquidCrowdloan];
  }
  if ('ForeignAssetId' in localId) return ['ForeignAsset', localId.ForeignAssetId];
  if ('StableAssetId' in localId) return ['StableAssetPoolToken', localId.StableAssetId];
  if ('Erc20' in localId) return ['Erc20', localId.Erc20];

  throw new Error('Unknown asset type');
}
async function main() {
    // const provider = new WsProvider('wss://karura.api.onfinality.io/public-ws');
    // const api = new ApiPromise(options({ provider }));
    // await api.isReady;
    // let api = await getApiForNode("Acala", false)
    // if(!api){
    //     throw new Error("API not connected")
    // }
    // await saveAssets()
    // await queryAssetsAndLocations(api)
    // getAssets()
    // await saveAssets()
    // await queryLocations(api)
    // getAssetLocations(api)
    // await queryAssets(api)
    await testLocalIdTypes()
    // process.exit(0)
}

// main()