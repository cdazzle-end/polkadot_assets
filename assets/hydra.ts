import * as fs from 'fs';
import path from 'path';
import { MyJunction, MyAsset, MyAssetRegistryObject, MyMultiLocation } from '../types.ts';
import { Keyring, ApiPromise, WsProvider } from '@polkadot/api';
import { deepEqual, getApiForNode } from './../utils.ts';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function saveAssets() {
    // const provider = new WsProvider('wss://basilisk-rpc.dwellir.com');
    // const api = await ApiPromise.create({ provider: provider });
    let api = await getApiForNode("HydraDX", false);
    await api.isReady;
    let assetData = await queryAssets(api);
    let assetLocations = await queryLocations(api);

    console.log(assetLocations)

    let assetRegistry = await assetData.map(([asset, assetId]: any) => {
        let matchedLocation = assetLocations.find(([location, locationId]: any) => {
            return assetId == locationId
        })

        if (matchedLocation == undefined) {
            const newAssetRegistryObject: MyAssetRegistryObject = {
                tokenData: asset,
                hasLocation: false
            }
            return newAssetRegistryObject
        } else {
            console.log(matchedLocation[0])
            const newAssetRegistryObject: MyAssetRegistryObject = {
                tokenData: asset,
                hasLocation: true,
                tokenLocation: matchedLocation[0]
            }
            return newAssetRegistryObject
        }
    });
    // assetRegistry.forEach((asset: any) => {
    //     console.log(asset)
    //     console.log(asset.tokenLocation)
    // })

    const filePath = path.join(__dirname, 'asset_registry/hdx_assets.json')
    // console.log(JSON.stringify(assetRegistry, null, 2))
    fs.writeFileSync(filePath, JSON.stringify(assetRegistry, null, 2))
    process.exit(0)
}

//AssetMetadataMap merged into assets
async function queryAssets(api:any) {
    let assets = await api.query.assetRegistry.assets.entries();
    let assetRegistry = assets.map(([key, value]: any) => {
        let assetData1 = key.toHuman() as any;
        let assetData2 = value.toHuman() as any;
        if(assetData2.assetType.toLowerCase() == "xyk" || assetData2.assetType.toLowerCase() == "bond"){
            let decimals
            if(assetData2["decimals"] == null){
                decimals = 0;
            } else {
                decimals = assetData2["decimals"]
            }

            let newMyAsset: MyAsset = {
                network: "polkadot",
                chain: 2034,
                localId: assetData1[0].replace(/,/g, ""),
                name: assetData2["name"],
                symbol: assetData1[0].replace(/,/g, ""),
                decimals: "0",
            }
            // console.log(assetData1[0].replace(/,/g, ""))
            return [newMyAsset, assetData1[0].replace(/,/g, "")]
        } else {
            let newMyAsset: MyAsset = {
                network: "polkadot",
                chain: 2034,
                localId: assetData1[0].replace(/,/g, ""),
                name: assetData2["name"],
                symbol: assetData2["symbol"],
                decimals: assetData2["decimals"],
            }
            // console.log(assetData1[0].replace(/,/g, ""))
            return [newMyAsset, assetData1[0].replace(/,/g, "")]
        }
    })
    // assetRegistry = assetRegistry.filter(([asset, id]: any) => {
    //     return asset.symbol != null
    // })
    // let assetMeta = await api.query.assetRegistry.assetMetadataMap.entries();
    // let assetRegistry = assetMeta.map(([key,value]: any) => {
    //     let k1 = key.toHuman() as any
    //     let matchedAsset = assets.find(([assetKey, assetValue]: any) => {
    //         let k2 = assetKey.toHuman() as any;
    //         if (k1[0] == k2[0]) {
    //             console.log("Matched")
    //             return true
    //         }
    //     })
    //     if (matchedAsset != undefined) {
    //         let [assetKey, assetValue] = matchedAsset;
    //         let assetData1 = value.toHuman() as any;
    //         let assetData2 = assetValue.toHuman() as any;
    //         let newMyAsset: MyAsset = {
    //             network: "polkadot",
    //             chain: 2034,
    //             localId: k1[0],
    //             name: assetData2["name"],
    //             symbol: assetData1["symbol"],
    //             decimals: assetData1["decimals"],
    //         }
    //         // console.log(newMyAsset)
    //         return [newMyAsset, k1[0]]
    //     }
    // })
    // assetRegistry.forEach(([asset, id]: any) => {
    //     console.log(id)
    //     console.log(asset)
    // })
    // console.log(assets.length)
    // console.log(assetMeta.length)
    return assetRegistry
}

// Find parachain value and remove commas
function updateValueByKey(obj: any, targetKey: any): any {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    for (let key in obj) {
        if (key === targetKey && typeof obj[key] === 'string') {
            // Remove commas if the value is a string
            obj[key] = obj[key].replace(/,/g, '');
        } else {
            // Recursively check and update nested objects
            obj[key] = updateValueByKey(obj[key], targetKey);
        }
    }

    return obj;
}
//Remove all commas
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

function findValueByKey(obj: any, targetKey: any): any {
    if (typeof obj !== 'object' || obj === null) {
        return null;
    }
    for (let key in obj) {
        if (key === targetKey) {
            return obj[key];
        }

        let foundValue: any = findValueByKey(obj[key], targetKey);
        if (foundValue !== null) {
            return foundValue;
        }
    }

    return null;
}

async function queryLocations(api:any) {
    // const provider = new WsProvider('wss://basilisk-rpc.dwellir.com');
    // const api = await ApiPromise.create({ provider: provider });
    // await api.isReady;
    console.log("***************")
    let locationEntries = await api.query.assetRegistry.assetLocations.entries();
    let locations = locationEntries.map(([id, location]: any) => {
        const currencyId = (id.toHuman() as any)[0].replace(/,/g, "");
        // console.log(currencyId)
        let locationData = (location.toHuman() as any);
        locationData = removeCommasFromAllValues(locationData)
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
    let hdxLocation = {
        X2: [
            { Parachain: "2034" },
            { GeneralIndex: "0" }
        ]
    }
    locations.push([hdxLocation, 0]) 
    
    // Fix asset wit wrong location value 16,555, 404
    locations = locations.map(([location, id]: any) => {
        // console.log(`Location: ${id} -- ${JSON.stringify(location, null, 2)}`)
        if(id == 1000207){
            let fixedLocation = {
                "X3": [
                    {
                    "Parachain": "1000"
                    },
                    {
                    "PalletInstance": "50"
                    },
                    {
                    "GeneralIndex": "20090124"
                    }
                ]
            }
            return [fixedLocation, id]
        }
        let locationParams = location["X3"]
        let parachain = findValueByKey(location, "Parachain");
        if(parachain == "1000"){
            let locationKeys = locationParams.map((locationParam: any) => {
                return Object.keys(locationParam)[0]
            })
            let locationValues = locationParams.map((locationParam: any) => {
                return Object.values(locationParam)[0]
            })
            if(locationKeys[0] == "Parachain" && locationKeys[1] == "Parachain" && locationKeys[2] == "Parachain"){
                // console.log(JSON.stringify(locationParams, null, 2))
                let fixedLocation = {
                    "X3": [
                        {
                        "Parachain": "1000"
                        },
                        {
                        "PalletInstance": "50"
                        },
                        {
                        "GeneralIndex": locationValues[2]
                        }
                    ]
                }
                // console.log(JSON.stringify(fixedLocation, null, 2))
                return [fixedLocation, id]
            } else {
                return [location, id]
            }
        }
        return [location, id]
    })
    return locations;

}

// Updates asset registry, requires Assethub and BifrostPolkadot registries to be up to date in order to properly format data
export async function updateAssetRegistryHydra(chopsticks: boolean){
    let api = await getApiForNode("HydraDX", chopsticks);
    await api.isReady;
    let assetData = await queryAssets(api);
    let assetLocations = await queryLocations(api);

    // Query all assets from api
    let currentAssets: MyAssetRegistryObject[] = await assetData.map(([asset, assetId]: any) => {
        let matchedLocation = assetLocations.find(([location, locationId]: any) => {
            if(assetId == locationId){
                // console.log(`${assetId} == ${locationId}`)
            }
            return assetId == locationId
        })

        if (matchedLocation == undefined) {
            // console.log(`No location found for ${assetId}`)
            const newAssetRegistryObject: MyAssetRegistryObject = {
                tokenData: asset,
                hasLocation: false
            }
            return newAssetRegistryObject
        } else {
            // console.log(matchedLocation[0])
            const newAssetRegistryObject: MyAssetRegistryObject = {
                tokenData: asset,
                hasLocation: true,
                tokenLocation: matchedLocation[0]
            }
            return newAssetRegistryObject
        }
    });

    console.log(`Number of queried assets from api: ${currentAssets.length}`)

    let newAssets: MyAssetRegistryObject[] = []

    // Get all assets from our registry
    let hydraRegistry: MyAssetRegistryObject[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'asset_registry/hdx_assets.json'), 'utf8'));
    console.log(`Number of assets in registry: ${hydraRegistry.length}`)

    // Go through current assets, find matching asset by deep equal in registry
    currentAssets.forEach((currentAsset: MyAssetRegistryObject) => {
        let currentAssetData = currentAsset.tokenData as MyAsset
        let assetFound = hydraRegistry.find((registryAsset) => {
            let registryAssetData = registryAsset.tokenData as MyAsset
            if(registryAssetData.localId == currentAssetData.localId){
                return true
            } else {
                return false
            }
            // return deepEqual(currentAsset, registryAsset);
        });
        if (!assetFound) {
            newAssets.push(currentAsset);
        }
    })

    console.log(`Number of new assets ${newAssets.length}`)

    // ** EDGE Where not deep equal but matching ID. See if new asset has matching asset id in registry, and replace it. 
    for (let asset of newAssets) {
        for(let i = 0; i < hydraRegistry.length; i++){
            let registryAsset = hydraRegistry[i].tokenData as MyAsset
            let newAsset = asset.tokenData as MyAsset
            if(registryAsset.localId == newAsset.localId){
                hydraRegistry[i] = asset
            }
        }
    }

    console.log("Updated Registry")

    let assetRegistryUpdated = hydraRegistry
    newAssets.forEach((newAsset: MyAssetRegistryObject) => {
        let existringAsset = hydraRegistry.find((registryAsset, index) => {
            deepEqual(newAsset, registryAsset)
        })
        if(!existringAsset){
            assetRegistryUpdated.push(newAsset)
        }
    })


    // console.log(`New Assets: ${JSON.stringify(newAssets, null, 2)}`)
    assetRegistryUpdated = await getAssetHubData(assetRegistryUpdated)
    assetRegistryUpdated = await getBncAssetData(assetRegistryUpdated)
    assetRegistryUpdated = await removeAssetsWithoutData(assetRegistryUpdated)
    // console.log(`New Assets: ${newAssets.length}`)
    console.log(`Number of assets: ${assetRegistryUpdated.length}`)
    fs.writeFileSync(path.join(__dirname, 'asset_registry/hdx_assets.json'), JSON.stringify(assetRegistryUpdated, null, 2))
}

async function removeRegistryDuplicates(){
    let registry = JSON.parse(fs.readFileSync(path.join(__dirname, 'asset_registry/hdx_assets.json'), 'utf8'));
    console.log(`Number of assets: ${registry.length}`)
    let updatedRegistry: MyAssetRegistryObject[] = []
    registry.forEach((asset: MyAssetRegistryObject) => {
        let assetFound = updatedRegistry.find((assetHere) => {
            return deepEqual(asset, assetHere);
        });
        if (!assetFound) {
            updatedRegistry.push(asset);
        }
    })
    console.log(`Number of assets: ${updatedRegistry.length}`)
    fs.writeFileSync(path.join(__dirname, 'asset_registry/hdx_assets.json'), JSON.stringify(updatedRegistry, null, 2))

}

async function cleanAssetIds(){
    let hydraAssets: MyAssetRegistryObject[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'asset_registry/hdx_assets.json'), 'utf8'));

    let cleanedAssets = 0
    let updatedAssets = hydraAssets.map((asset: MyAssetRegistryObject) => {
        let tokenData = asset.tokenData as MyAsset;
        let localId = tokenData.localId;
        if(localId.includes(",")){
            cleanedAssets++
            console.log(JSON.stringify(localId, null, 2))
            let newId = localId.replace(/,/g, "");
            console.log(JSON.stringify(newId, null, 2))
            tokenData.localId = newId;
            asset.tokenData = tokenData;
        }
        return asset
    })
    console.log(`Cleaned Assets: ${cleanedAssets}`)
    console.log(`Number of assets: ${updatedAssets.length}`)
    // fs.writeFileSync(path.join(__dirname, 'asset_registry/hdx_assets.json'), JSON.stringify(updatedAssets, null, 2))
}

// Get asset data for asset hub assets that arent properly defined in the hydra registry
function getAssetHubData(hydraRegistry: MyAssetRegistryObject[]){
    // let hydraRegistry: MyAssetRegistryObject[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'asset_registry/hdx_assets.json'), 'utf8'));
    let assetHubRegistry: any[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'asset_registry/asset_hub_polkadot_assets.json'), 'utf8')) as any[]
    let hydraLpRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, './../lps/lp_registry/hdx_lps.json'), 'utf8'))
    let assetsMissingData: MyAssetRegistryObject[] = []
    hydraRegistry.forEach((hydraAsset: MyAssetRegistryObject, index) => {
        let tokenData = hydraAsset.tokenData as MyAsset;
        if(tokenData.symbol == null || tokenData.name == null || tokenData.decimals == null){
            // Filter out assets that aren't in LP registry
            let parachain = findValueByKey(hydraAsset.tokenLocation, "Parachain");
            // Find asset hub token data. If not found, check if it exists in LP registry. If its in lp registry, but cant find data, throw errpr
            if (parachain == "1000"){
                let assetHubAsset = assetHubRegistry.find((assetHubAsset: any) => {
                    return deepEqual(hydraAsset.tokenLocation, assetHubAsset.tokenLocation)
                })
    
                if(!assetHubAsset){
                    let lpRegistryContainsAsset = hydraLpRegistry.find((lp: any) => {
                        lp.poolAssets.forEach((poolAsset: any) => {
                            if(poolAsset.localId == tokenData.localId){
                                console.log(`Asset found in LP registry: ${tokenData.localId}`)
                                console.log(JSON.stringify(lp, null, 2))
                                return true
                            }
                        })
                    })
                    if(lpRegistryContainsAsset){
                        throw new Error(`Cant find asset hub asset: ${tokenData.localId} -- ${parachain} | But it exists as an lp asset`)
                    }
                } else {
                    let symbol = assetHubAsset.tokenData.symbol;
                    let name = assetHubAsset.tokenData.name;
                    let decimals = assetHubAsset.tokenData.decimals;
                    let newTokenData = tokenData
                    newTokenData.symbol = symbol;
                    newTokenData.name = name;
                    newTokenData.decimals = decimals;
        
                    hydraRegistry[index].tokenData = newTokenData;

                    // console.log(`Updated asset: ${JSON.stringify(newTokenData, null, 2)}`)
                }
    
    
            }
        }
    })

    return hydraRegistry
    // fs.writeFileSync(path.join(__dirname, 'asset_registry/hdx_assets.json'), JSON.stringify(hydraRegistry, null, 2))
}

function getBncAssetData(hydraRegistry: MyAssetRegistryObject[]){
    let bncRegistry: any[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'asset_registry/bnc_polkadot_assets.json'), 'utf8')) as any[]
    let hydraLpRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, './../lps/lp_registry/hdx_lps.json'), 'utf8'))

    hydraRegistry.forEach((hydraAsset: MyAssetRegistryObject, index) => {
        let tokenData = hydraAsset.tokenData as MyAsset;
        if(tokenData.symbol == null || tokenData.name == null || tokenData.decimals == null){
            // Filter out assets that aren't in LP registry
            // assetsMissingData.push(asset)
            // let tokenData = hydraAsset.tokenData as MyAsset;
            // console.log(`Hydra Asset ${JSON.stringify(hydraAsset, null, 2)}`)
            let parachain = findValueByKey(hydraAsset.tokenLocation, "Parachain");
            // console.log("Parachain: ", parachain)
            // console.log(`Asset missing data: ${tokenData.localId} -- ${parachain}`)
    
            // Find asset hub token data. If not found, check if it exists in LP registry. If its in lp registry, but cant find data, throw errpr
            if (parachain == "2030"){
                let bncAsset = bncRegistry.find((bncAsset: any) => {
                    return deepEqual(hydraAsset.tokenLocation, bncAsset.tokenLocation)
                })
    
                if(!bncAsset){
                    throw new Error(`Cant find bnc asset: ${tokenData.localId} -- ${parachain}`)
                    // let lpRegistryContainsAsset = hydraLpRegistry.find((lp: any) => {
                    //     lp.poolAssets.forEach((poolAsset: any) => {
                    //         if(poolAsset.localId == tokenData.localId){
                    //             console.log(`Asset found in LP registry: ${tokenData.localId}`)
                    //             console.log(JSON.stringify(lp, null, 2))
                    //             return true
                    //         }
                    //     })
                    // })
                    // if(lpRegistryContainsAsset){
                    //     throw new Error(`Cant find asset hub asset: ${tokenData.localId} -- ${parachain} | But it exists as an lp asset`)
                    // }
                } else {
                    let symbol = bncAsset.tokenData.symbol;
                    let name = bncAsset.tokenData.name;
                    let decimals = bncAsset.tokenData.decimals;
                    let newTokenData = tokenData
                    newTokenData.symbol = symbol;
                    newTokenData.name = name;
                    newTokenData.decimals = decimals;
        
                    hydraRegistry[index].tokenData = newTokenData;

                    // console.log(`Updated asset: ${JSON.stringify(newTokenData, null, 2)}`)
                }
    
    
            }
        }
    })
    return hydraRegistry
}

// Remove assets from the registry that are not properly defined, If there decimal == null
async function removeAssetsWithoutData(hydraRegistry: MyAssetRegistryObject[]){
    // let hydraRegistry: MyAssetRegistryObject[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'asset_registry/hdx_assets.json'), 'utf8'));
    let hydraLpRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, './../lps/lp_registry/hdx_lps.json'), 'utf8'))
    let assetsWithoutData = hydraRegistry.filter((asset: MyAssetRegistryObject) => {
        let tokenData = asset.tokenData as MyAsset;
        return tokenData.decimals == null
    })
    console.log(`Assets without data: ${assetsWithoutData.length}`)
    console.log(`Asset registry: ${hydraRegistry.length}`)
    let updatedRegistry = hydraRegistry.filter((asset: MyAssetRegistryObject) => {
        let tokenData = asset.tokenData as MyAsset;

        // If token decimals = null and does not exist in lp registry remove
        if(tokenData.decimals == null){
            let lpRegistryContainsAsset = hydraLpRegistry.find((lp: any) => {
                lp.poolAssets.forEach((poolAsset: any) => {
                    if(poolAsset.localId == tokenData.localId){
                        return true
                    }
                })
            })
            if(!lpRegistryContainsAsset){
                console.log(`Removing asset: ${tokenData.localId}`)
                return false
            }
        }
        return true
    })
    console.log(`Updated Registry: ${updatedRegistry.length}`)
    return updatedRegistry

    // let assetsWithoutDataInLpRegistry = assetsWithoutData.filter((asset: MyAssetRegistryObject) => {
    //     let tokenData = asset.tokenData as MyAsset;

    //     return lpRegistryContainsAsset
    // })
    // console.log(`Assets without data in LP registry: ${assetsWithoutDataInLpRegistry.length}`)
    // fs.writeFileSync(path.join(__dirname, 'asset_registry/hdx_assets.json'), JSON.stringify(updatedRegistry, null, 2))
}

async function main() {
    // const provider = new WsProvider('wss://basilisk-rpc.dwellir.com');
    // const api = await ApiPromise.create({ provider: provider });
    // await api.isReady;
    // let api = await getApiForNode("HydraDX", false);
    // await queryAssets(api);
    // await queryLocations(api);
    // await saveAssets();
    // await queryLocations(api)
    // await updateAssetRegistryHydra();
    // await removeRegistryDuplicates()
    // await removeAssetsWithoutData()
    // await getAssetHubData();
    // await cleanAssetIds()
    process.exit(0)
}

// main()