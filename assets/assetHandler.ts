import * as fs from 'fs';
import path from 'path';
import { MyJunction, MyAsset, MyAssetRegistryObject, MyMultiLocation } from '../types.ts';
import { getNativeAsset, getStableAsset } from './acaNativeAssets.ts';
import { Keyring, ApiPromise, WsProvider } from '@polkadot/api';
// import {WsProvider } from '@polkadot/rpc-provider'
import { options } from '@acala-network/api'
import { getApiForNode } from '../utils.ts';
import { fileURLToPath } from 'url';
import { updateRegistryAssetHub as updateAssetRegistryAssetHub } from './assetHubPolkadot.ts';
import { updateAssetRegistryHydra } from './hydra.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update AssetHub and HyrdraDX, as these are the only ones that change often. Could change to update others if needed
async function updateAssetRegistry(){
    await updateAssetRegistryAssetHub()
    await updateAssetRegistryHydra()
}

async function main(){
    await updateAssetRegistry()
    process.exit(0)
}

// main()